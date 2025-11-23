const mercadopago = require('../config/mercadoPago');
const pool = require('../config/db'); 
const { Preference, Payment } = require('mercadopago');

const RECHARGE_PACKAGES = {
  pack1: { title: 'Pack Inicial', amount: 5000, bonus: 5000, price: 5000 }, 
  pack2: { title: 'Pack Bronce', amount: 10000, bonus: 5000, price: 10000 }, 
  pack3: { title: 'Pack Plata', amount: 15000, bonus: 7500, price: 15000 }, 
  pack4: { title: 'Pack Oro', amount: 20000, bonus: 5000, price: 25000 }, 
  pack5: { title: 'Pack Platino', amount: 50000, bonus: 12500, price: 50000 }, 
  pack6: { title: 'Pack Diamante', amount: 100000, bonus: 30000, price: 100000 }, 
};


exports.createRechargePreference = async (req, res) => {
  try {
    const { userId, nickname, email } = req.user; 
    const { packageId } = req.body;
    
    

    const selectedPackage = RECHARGE_PACKAGES[packageId];

    if (!userId || !selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'Petición inválida - paquete no válido'
      });
    }

    const totalFichas = selectedPackage.amount + selectedPackage.bonus;

    const preference = new Preference(mercadopago);
    const payload = {
      external_reference: `recharge-${userId}-${Date.now()}`,
    
      items: [{
        id: `pack_${packageId}`,
        title: `${selectedPackage.title} - ${totalFichas.toLocaleString('es-CL')} fichas`,
        description: `Recarga de saldo para juegos NIMETSU (${selectedPackage.amount.toLocaleString('es-CL')} + ${selectedPackage.bonus.toLocaleString('es-CL')} bonus)`,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: selectedPackage.price
      }],
    
      payer: {
        name: nickname,
        email: email,
      },
    
      back_urls: {
        success: `${process.env.APP_URL}/payment/recharge-success`,
        failure: `${process.env.APP_URL}/payment/recharge-failure`,
        pending: `${process.env.APP_URL}/payment/recharge-pending`
      },
      
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/payment/webhook`,
      metadata: { 
        user_id: userId, 
        package_id: packageId,
        fichas_amount: selectedPackage.amount,
        fichas_bonus: selectedPackage.bonus,
        total_fichas: totalFichas,
        type: 'recharge'
      }
    };
    
    

    const result = await preference.create({ body: payload });
    const initPoint = result.init_point || result.body?.init_point;
    const preferenceId = result.id || result.body?.id;
    
    

    await pool.query(
      `INSERT INTO transactions 
       (userId, type, method, amount, fichas, status, preference_id, external_reference) 
       VALUES (?, 'deposit', 'mercadopago', ?, ?, 'pending', ?, ?)`,
      [userId, selectedPackage.price, totalFichas, preferenceId, payload.external_reference]
    );

    res.json({ 
      success: true,
      init_point: initPoint 
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error creando el enlace de pago'
    });
  }
};

exports.webhook = async (req, res) => {
  const paymentId = req.body?.data?.id;
  

  if (req.body.type !== 'payment' || !paymentId) {
    
    return res.sendStatus(200);
  }

  try {
    const paymentClient = new Payment(mercadopago);
    const result = await paymentClient.get({ id: paymentId });

    const payment = result?.body ?? result;

    if (!payment?.status) {
      
      return res.sendStatus(200);
    }

    
    

    if (payment.status === 'approved') {
      const metadata = payment.metadata;
      
      if (metadata?.type === 'recharge') {
        const userId = metadata?.user_id;
        const totalFichas = metadata?.total_fichas || (metadata?.fichas_amount + metadata?.fichas_bonus);

        if (!userId || !totalFichas) {
          
          return res.sendStatus(200);
        }

        await pool.query(
          'UPDATE balances SET balance = balance + ? WHERE userId = ?',
          [totalFichas, userId]
        );

        await pool.query(
          `UPDATE transactions 
           SET status = 'completed', payment_id = ?, completedAt = NOW(), processedAt = NOW()
           WHERE userId = ? AND preference_id IN (
             SELECT preference_id FROM (
               SELECT preference_id FROM transactions 
               WHERE userId = ? AND type = 'deposit' AND status = 'pending'
               ORDER BY createdAt DESC LIMIT 1
             ) AS temp
           )`,
          [payment.id, userId, userId]
        );

        const [txResult] = await pool.query(
          'SELECT transactionId FROM transactions WHERE payment_id = ? LIMIT 1',
          [payment.id]
        );
        
        if (txResult.length > 0) {
          await pool.query(
            `INSERT INTO transaction_status_history 
             (transactionId, old_status, new_status, reason) 
             VALUES (?, 'pending', 'completed', 'Pago aprobado por MercadoPago')`,
            [txResult[0].transactionId]
          );
        }

        
      }
    } else {
      
    }

    res.sendStatus(200);
  } catch (err) {
    
    res.sendStatus(500);
  }
};
  
exports.rechargeSuccess = (req, res) => {
  res.render('recharge-success', {
    page: 'recharge-success'
  });
};

exports.rechargeFailure = (req, res) => {
  res.render('recharge-failure', {
    page: 'recharge-failure'
  });
};

exports.rechargePending = (req, res) => {
  res.render('recharge-pending', {
    page: 'recharge-pending'
  });
};

exports.getPackages = (req, res) => {
  res.json({
    success: true,
    packages: RECHARGE_PACKAGES
  });
};

exports.createCustomRecharge = async (req, res) => {
  try {
    const { userId, nickname, email } = req.user; 
    const { amount } = req.body;
    
    

    if (!amount || isNaN(amount) || amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'El monto mínimo es $500 CLP'
      });
    }

    const roundedAmount = Math.floor(amount);

    const totalFichas = roundedAmount;

    const preference = new Preference(mercadopago);
    const payload = {
      external_reference: `custom-recharge-${userId}-${Date.now()}`,
    
      items: [{
        id: 'custom_recharge',
        title: `Recarga de ${roundedAmount.toLocaleString('es-CL')} fichas`,
        description: 'Depósito personalizado - juegos NIMETSU',
        quantity: 1,
        currency_id: 'CLP',
        unit_price: roundedAmount
      }],
    
      payer: {
        name: nickname,
        email: email,
      },
    
      back_urls: {
        success: `${process.env.APP_URL}/payment/recharge-success`,
        failure: `${process.env.APP_URL}/payment/recharge-failure`,
        pending: `${process.env.APP_URL}/payment/recharge-pending`
      },
      
      auto_return: 'approved',
      notification_url: `${process.env.APP_URL}/payment/webhook`,
      metadata: { 
        user_id: userId, 
        package_id: 'custom',
        fichas_amount: roundedAmount,
        fichas_bonus: 0,
        total_fichas: totalFichas,
        type: 'recharge'
      }
    };
    
    

    const result = await preference.create({ body: payload });
    const initPoint = result.init_point || result.body?.init_point;
    const preferenceId = result.id || result.body?.id;
    
    

    await pool.query(
      `INSERT INTO transactions 
       (userId, type, method, amount, fichas, status, preference_id, external_reference) 
       VALUES (?, 'deposit', 'mercadopago', ?, ?, 'pending', ?, ?)`,
      [userId, roundedAmount, totalFichas, preferenceId, payload.external_reference]
    );

    res.json({ 
      success: true,
      init_point: initPoint 
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error creando el enlace de pago'
    });
  }
};