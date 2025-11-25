'use strict';

const pool = require('../config/db');
const balanceService = require('../services/balanceService');


async function renderAdminSelector(req, res) {
  try {
    return res.render('admin/selector', {
      title: 'Seleccionar Panel - Nimetsu Casino',
    });
  } catch (err) {
    
    return res.redirect('/login');
  }
}


async function renderDashboard(req, res) {
  try {
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM transactions WHERE type = 'deposit') as totalDeposits,
        (SELECT COUNT(*) FROM transactions WHERE type = 'withdraw') as totalWithdrawals,
        (SELECT COUNT(*) FROM transactions WHERE status = 'pending' OR status = 'processing') as pendingTransactions,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'deposit' AND status = 'completed') as totalDepositAmount,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'withdraw' AND status = 'completed') as totalWithdrawAmount
    `);

    return res.render('admin/dashboard', {
      title: 'Panel de Administración - Nimetsu Casino',
      stats: stats[0] || {},
    });
  } catch (err) {
    
    return res.status(500).send('Error al cargar el dashboard');
  }
}

async function renderUsers(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [users] = await pool.query(`
      SELECT 
        u.userId,
        u.nickname,
        u.email,
        u.rut,
        u.role,
        u.createdAt,
        COALESCE(b.balance, 0) as balance,
        COALESCE(b.locked, 0) as locked
      FROM users u
      LEFT JOIN balances b ON u.userId = b.userId
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalPages = Math.ceil(total / limit);

    return res.render('admin/users', {
      title: 'Gestión de Usuarios - Admin',
      users,
      currentPage: page,
      totalPages,
      total,
    });
  } catch (err) {
    
    return res.status(500).send('Error al cargar usuarios');
  }
}


async function renderTransactions(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';
    const type = req.query.type || 'all';

    let whereConditions = [];
    let params = [];

    if (status !== 'all') {
      whereConditions.push('t.status = ?');
      params.push(status);
    }

    if (type !== 'all') {
      whereConditions.push('t.type = ?');
      params.push(type);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [transactions] = await pool.query(`
      SELECT 
        t.*,
        u.nickname,
        u.email
      FROM transactions t
      LEFT JOIN users u ON t.userId = u.userId
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM transactions t ${whereClause}
    `, params);

    const totalPages = Math.ceil(total / limit);

    return res.render('admin/transactions', {
      title: 'Gestión de Transacciones - Admin',
      transactions,
      currentPage: page,
      totalPages,
      total,
      currentStatus: status,
      currentType: type,
    });
  } catch (err) {
    
    return res.status(500).send('Error al cargar transacciones');
  }
}


async function renderGames(req, res) {
  try {
    const [gameStats] = await pool.query(`
      SELECT 
        gameName,
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'lose' THEN 1 ELSE 0 END) as losses,
        COALESCE(SUM(betAmount), 0) as totalBet,
        COALESCE(SUM(winAmount), 0) as totalWon
      FROM game_history
      GROUP BY gameName
      ORDER BY totalGames DESC
    `).catch(() => [[]]);

    return res.render('admin/games', {
      title: 'Estadísticas de Juegos - Admin',
      gameStats: gameStats || [],
    });
  } catch (err) {
    
    return res.status(500).send('Error al cargar estadísticas');
  }
}

async function renderSettings(req, res) {
  try {
    return res.render('admin/settings', {
      title: 'Configuración del Sistema - Admin',
    });
  } catch (err) {
    
    return res.status(500).send('Error al cargar configuración');
  }
}

async function getUserDetails(req, res) {
  try {
    const { userId } = req.params;

    const [users] = await pool.query(`
      SELECT 
        u.*,
        COALESCE(b.balance, 0) as balance,
        COALESCE(b.locked, 0) as locked
      FROM users u
      LEFT JOIN balances b ON u.userId = b.userId
      WHERE u.userId = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    const [transactions] = await pool.query(`
      SELECT * FROM transactions 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 10
    `, [userId]);

    return res.json({
      ok: true,
      user: users[0],
      transactions,
    });
  } catch (err) {
    
    return res.status(500).json({ ok: false, message: 'Error al obtener usuario' });
  }
}

async function createUser(req, res) {
  try {
    const { nickname, email, rut, password, balance, role } = req.body;
    const adminRole = req.user?.role || 'user';

    if (!nickname || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (role === 'superadmin' && adminRole !== 'superadmin') {
      return res.status(403).json({ ok: false, message: 'Solo un superadmin puede crear otros superadmins' });
    }

    if (role === 'admin' && adminRole !== 'superadmin' && adminRole !== 'admin') {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para crear administradores' });
    }

    const [existingEmail] = await pool.query('SELECT userId FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ ok: false, message: 'El email ya está registrado' });
    }

    if (rut) {
      const [existingRut] = await pool.query('SELECT userId FROM users WHERE rut = ?', [rut]);
      if (existingRut.length > 0) {
        return res.status(409).json({ ok: false, message: 'El RUT ya está registrado' });
      }
    }

    const bcrypt = require('bcryptjs');
    const passHash = await bcrypt.hash(password, 12);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        'INSERT INTO users (nickname, email, passHash, rut, role) VALUES (?, ?, ?, ?, ?)',
        [nickname, email, passHash, rut || null, role || 'user']
      );

      const userId = result.insertId;

      const initialBalance = parseInt(balance, 10) || 1000;
      await connection.query(
        'INSERT INTO balances (userId, balance, locked) VALUES (?, ?, ?)',
        [userId, initialBalance, 0]
      );

      await connection.commit();
      connection.release();

      return res.json({
        ok: true,
        message: 'Usuario creado exitosamente',
        userId,
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ ok: false, message: 'Error al crear usuario' });
  }
}

async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { nickname, email, rut, password, balance, locked, role } = req.body;
    const adminRole = req.user?.role || 'user';

    const [[currentUser]] = await pool.query('SELECT role FROM users WHERE userId = ?', [userId]);
    if (!currentUser) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    if (role && role !== currentUser.role) {
      if (currentUser.role === 'superadmin' && adminRole !== 'superadmin') {
        return res.status(403).json({ ok: false, message: 'No puedes modificar un superadministrador' });
      }

      if (role === 'superadmin' && adminRole !== 'superadmin') {
        return res.status(403).json({ ok: false, message: 'Solo un superadmin puede asignar el rol de superadmin a otros usuarios' });
      }

      if (role === 'admin' && adminRole !== 'superadmin' && adminRole !== 'admin') {
        return res.status(403).json({ ok: false, message: 'No tienes permisos para asignar el rol de administrador' });
      }
    }

    // Verificar email único
    if (email) {
      const [existingEmail] = await pool.query('SELECT userId FROM users WHERE email = ? AND userId != ?', [email, userId]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ ok: false, message: 'El email ya está en uso' });
      }
    }

    // Verificar RUT único
    if (rut) {
      const [existingRut] = await pool.query('SELECT userId FROM users WHERE rut = ? AND userId != ?', [rut, userId]);
      if (existingRut.length > 0) {
        return res.status(409).json({ ok: false, message: 'El RUT ya está en uso' });
      }
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Actualizar datos de usuario
      let updateFields = [];
      let updateValues = [];

      if (nickname) {
        updateFields.push('nickname = ?');
        updateValues.push(nickname);
      }
      if (email) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      if (rut !== undefined) {
        updateFields.push('rut = ?');
        updateValues.push(rut || null);
      }
      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }
      if (password) {
        if (password.length < 6) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const bcrypt = require('bcryptjs');
        const passHash = await bcrypt.hash(password, 12);
        updateFields.push('passHash = ?');
        updateValues.push(passHash);
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        await connection.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE userId = ?`,
          updateValues
        );
      }

      // Actualizar balance
      if (balance !== undefined || locked !== undefined) {
        if (balance !== undefined) {
          await balanceService.setBalance(userId, balance);
        }
        if (locked !== undefined) {
          await balanceService.setLocked(userId, locked);
        }
      }

      await connection.commit();
      connection.release();

      return res.json({
        ok: true,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ ok: false, message: 'Error al actualizar usuario' });
  }
}

async function adjustUserBalance(req, res) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Monto inválido' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Determinar el tipo de transacción según si es positivo o negativo
      const transactionType = parseFloat(amount) >= 0 ? 'deposit' : 'withdraw';
      const absoluteAmount = Math.abs(amount);
     
      await balanceService.updateBalance(userId, amount);

      await connection.query(
        `INSERT INTO transactions (userId, type, method, amount, fichas, status, notes, createdAt)
         VALUES (?, ?, 'manual_adjustment', ?, ?, 'completed', ?, NOW())`,
        [userId, transactionType, absoluteAmount, absoluteAmount, reason || 'Ajuste manual de administrador']
      );

      // Obtener el nuevo balance
      const newBalance = await balanceService.getBalance(userId);

      await connection.commit();
      connection.release();

      return res.json({
        success: true,
        message: 'Balance ajustado correctamente',
        newBalance: newBalance || 0
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Error al ajustar balance:', err);
    return res.status(500).json({ success: false, message: 'Error al ajustar balance' });
  }
}

async function getTransactionHistory(req, res) {
  try {
    const { transactionId } = req.params;

    const [history] = await pool.query(`
      SELECT
        tsh.historyId,
        tsh.transactionId,
        u.userId,
        u.nickname,
        u.email,
        t.type AS transaction_type,
        t.method AS payment_method,
        t.amount,
        t.fichas,
        t.status AS current_status,
        tsh.old_status,
        tsh.new_status,
        tsh.reason,
        tsh.createdAt AS status_changed_at,
        admin.nickname AS changed_by_name
      FROM transaction_status_history AS tsh
      INNER JOIN transactions AS t
        ON tsh.transactionId = t.transactionId
      INNER JOIN users AS u
        ON t.userId = u.userId
      LEFT JOIN users AS admin
        ON tsh.changed_by = admin.userId
      WHERE tsh.transactionId = ?
      ORDER BY tsh.createdAt DESC
    `, [transactionId]);

    const [transaction] = await pool.query(`
      SELECT 
        t.*,
        u.nickname,
        u.email,
        u.rut
      FROM transactions t
      LEFT JOIN users u ON t.userId = u.userId
      WHERE t.transactionId = ?
    `, [transactionId]);

    if (transaction.length === 0) {
      return res.status(404).json({ ok: false, message: 'Transacción no encontrada' });
    }

    return res.json({
      ok: true,
      transaction: transaction[0],
      history,
    });
  } catch (err) {
    
    return res.status(500).json({ ok: false, message: 'Error al obtener historial' });
  }
}

async function updateTransactionStatus(req, res) {
  try {
    const { transactionId } = req.params;
    const { status, reason, confirmedAmount } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      console.error('[UPDATE_TX_STATUS] Estado inválido:', status);
      return res.status(400).json({ ok: false, success: false, message: 'Estado inválido' });
    }

    const [[currentTx]] = await pool.query(
      'SELECT * FROM transactions WHERE transactionId = ?',
      [transactionId]
    );

    if (!currentTx) {
      return res.status(404).json({ ok: false, success: false, message: 'Transacción no encontrada' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        `UPDATE transactions 
         SET status = ?, notes = CONCAT(COALESCE(notes, ''), '\n', ?)
         WHERE transactionId = ?`,
        [status, reason || `Estado cambiado a ${status} por admin`, transactionId]
      );

      await connection.query(
        `INSERT INTO transaction_status_history (transactionId, old_status, new_status, changed_by, reason)
         VALUES (?, ?, ?, ?, ?)`,
        [transactionId, currentTx.status, status, req.user?.userId || null, reason || `Estado cambiado a ${status} por admin`]
      );


      if (status === 'completed' && currentTx.type === 'deposit' && confirmedAmount) {
        const amountToAdd = parseFloat(confirmedAmount);
        const fichasToAdd = Math.floor(amountToAdd);
        await balanceService.getOrCreateBalance(currentTx.userId);
        await balanceService.updateBalance(currentTx.userId, fichasToAdd);

        await connection.query(
          `UPDATE transactions SET fichas = ? WHERE transactionId = ?`,
          [fichasToAdd, transactionId]
        );

      }

      if (status === 'rejected' && currentTx.type === 'withdraw') {
        const fichasToReturn = currentTx.fichas || 0;
        
        await balanceService.updateBalance(currentTx.userId, fichasToReturn);
      }

      await connection.commit();
      connection.release();

      return res.json({
        ok: true,
        success: true,
        message: 'Estado actualizado correctamente',
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    
    return res.status(500).json({ ok: false, message: 'Error al actualizar estado' });
  }
}

module.exports = {
  renderAdminSelector,
  renderDashboard,
  renderUsers,
  renderTransactions,
  renderGames,
  renderSettings,
  getUserDetails,
  createUser,
  updateUser,
  adjustUserBalance,
  getTransactionHistory,
  updateTransactionStatus,
};
