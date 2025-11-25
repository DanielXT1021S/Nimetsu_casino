const pool = require('../config/db');
const balanceService = require('../services/balanceService');

exports.getPaymentMethods = async (req, res) => {
  try {
    const { userId } = req.user;

    const [methods] = await pool.query(
      `SELECT methodId, type, is_default, bank_name, account_type, 
              account_number, account_rut, crypto_type, wallet_address, 
              wallet_label, is_verified, createdAt
       FROM user_payment_methods 
       WHERE userId = ?
       ORDER BY is_default DESC, createdAt DESC`,
      [userId]
    );

    res.json({
      success: true,
      methods
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener métodos de pago'
    });
  }
};

exports.savePaymentMethod = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, bankData, cryptoData, isDefault } = req.body;

    if (!type || (type !== 'bank_account' && type !== 'crypto_wallet')) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de método inválido'
      });
    }

    if (isDefault) {
      await pool.query(
        'UPDATE user_payment_methods SET is_default = FALSE WHERE userId = ?',
        [userId]
      );
    }

    let query, params;

    if (type === 'bank_account') {
      query = `INSERT INTO user_payment_methods 
               (userId, type, is_default, bank_name, account_type, account_number, account_rut) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
      params = [
        userId,
        type,
        isDefault || false,
        bankData.bankName,
        bankData.accountType,
        bankData.accountNumber,
        bankData.accountRut
      ];
    } else {
      query = `INSERT INTO user_payment_methods 
               (userId, type, is_default, crypto_type, wallet_address, wallet_label) 
               VALUES (?, ?, ?, ?, ?, ?)`;
      params = [
        userId,
        type,
        isDefault || false,
        cryptoData.cryptoType,
        cryptoData.walletAddress,
        cryptoData.walletLabel || null
      ];
    }

    const [result] = await pool.query(query, params);

    res.json({
      success: true,
      methodId: result.insertId,
      message: 'Método de pago guardado exitosamente'
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al guardar método de pago'
    });
  }
};

exports.deletePaymentMethod = async (req, res) => {
  try {
    const { userId } = req.user;
    const { methodId } = req.params;

    await pool.query(
      'DELETE FROM user_payment_methods WHERE methodId = ? AND userId = ?',
      [methodId, userId]
    );

    res.json({
      success: true,
      message: 'Método de pago eliminado'
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al eliminar método de pago'
    });
  }
};

exports.requestBankWithdrawal = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, bankName, accountType, accountNumber, accountRut, saveMethod } = req.body;

    

    if (!amount || amount < 5000) {
      
      return res.status(400).json({
        success: false,
        message: 'El monto mínimo es $5,000 CLP'
      });
    }

    if (!bankName || !accountType || !accountNumber || !accountRut) {
      
      return res.status(400).json({
        success: false,
        message: 'Todos los datos bancarios son requeridos'
      });
    }

    const balance = await balanceService.getBalance(userId);

    

    if (balance === null || balance < amount) {
      
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    if (saveMethod) {
      await pool.query(
        `INSERT INTO user_payment_methods 
         (userId, type, bank_name, account_type, account_number, account_rut) 
         VALUES (?, 'bank_account', ?, ?, ?, ?)`,
        [userId, bankName, accountType, accountNumber, accountRut]
      );
    }

    const [txResult] = await pool.query(
      `INSERT INTO transactions 
       (userId, type, method, amount, fichas, status, bank_name, account_type, account_number, account_rut) 
       VALUES (?, 'withdraw', 'bank_transfer', ?, ?, 'pending', ?, ?, ?, ?)`,
      [userId, amount, amount, bankName, accountType, accountNumber, accountRut]
    );


    await balanceService.updateBalance(userId, -amount);

    await pool.query(
      `INSERT INTO transaction_status_history 
       (transactionId, old_status, new_status, reason) 
       VALUES (?, NULL, 'pending', 'Solicitud de retiro creada')`,
      [txResult.insertId]
    );


    res.json({
      success: true,
      transactionId: txResult.insertId,
      message: 'Solicitud de retiro creada. Será procesada en 1-3 días hábiles.'
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar solicitud de retiro'
    });
  }
};

exports.requestCryptoWithdrawal = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, cryptoType, walletAddress, saveMethod, walletLabel } = req.body;

    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'El monto mínimo es $10,000 fichas'
      });
    }

    if (!walletAddress || walletAddress.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Dirección de wallet inválida'
      });
    }

    const balance = await balanceService.getBalance(userId);

    if (balance === null || balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    const rates = {
      btc: 0.0000115,
      usdt: 0.00112
    };
    const cryptoAmount = amount * (rates[cryptoType] || 0);

    if (saveMethod) {
      await pool.query(
        `INSERT INTO user_payment_methods 
         (userId, type, crypto_type, wallet_address, wallet_label) 
         VALUES (?, 'crypto_wallet', ?, ?, ?)`,
        [userId, cryptoType, walletAddress, walletLabel || null]
      );
    }

    const [txResult] = await pool.query(
      `INSERT INTO transactions 
       (userId, type, method, amount, fichas, status, crypto_type, wallet_address, crypto_amount) 
       VALUES (?, 'withdraw', ?, ?, ?, 'pending', ?, ?, ?)`,
      [userId, `crypto_${cryptoType}`, amount, amount, cryptoType, walletAddress, cryptoAmount]
    );

    await balanceService.updateBalance(userId, -amount);

    await pool.query(
      `INSERT INTO transaction_status_history 
       (transactionId, old_status, new_status, reason) 
       VALUES (?, NULL, 'pending', 'Solicitud de retiro crypto creada')`,
      [txResult.insertId]
    );

    res.json({
      success: true,
      transactionId: txResult.insertId,
      cryptoAmount,
      message: 'Solicitud de retiro creada. Será procesada en 24-48 horas.'
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al procesar solicitud de retiro'
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT transactionId, type, method, amount, fichas, status,
             payment_id, bank_name, account_type, crypto_type, 
             wallet_address, crypto_amount, notes,
             createdAt, processedAt, completedAt
      FROM transactions 
      WHERE userId = ?
    `;
    const params = [userId];

    if (type && (type === 'deposit' || type === 'withdraw')) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

  
    const [transactions] = await pool.query(query, params);
    


    res.json({
      success: true,
      transactions,
      total: transactions.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de transacciones'
    });
  }
};

exports.getTransactionDetails = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const [transaction] = await pool.query(
      `SELECT t.*, 
              (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'old_status', old_status,
                  'new_status', new_status,
                  'reason', reason,
                  'createdAt', createdAt
                )
              )
              FROM transaction_status_history 
              WHERE transactionId = t.transactionId) as status_history
       FROM transactions t
       WHERE t.transactionId = ? AND t.userId = ?`,
      [id, userId]
    );

    if (!transaction.length) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    res.json({
      success: true,
      transaction: transaction[0]
    });
  } catch (err) {
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles'
    });
  }
};
