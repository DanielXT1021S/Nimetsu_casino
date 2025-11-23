'use strict';

const pool = require('../config/db');


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

async function adjustUserBalance(req, res) {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ ok: false, message: 'Monto inválido' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
     
      await connection.query(
        'UPDATE balances SET balance = balance + ? WHERE userId = ?',
        [amount, userId]
      );

      await connection.query(
        `INSERT INTO transactions (userId, type, amount, status, notes, createdAt)
         VALUES (?, 'adjustment', ?, 'completed', ?, NOW())`,
        [userId, Math.abs(amount), reason || 'Ajuste manual de administrador']
      );

      await connection.commit();
      connection.release();

      return res.json({
        ok: true,
        message: 'Balance ajustado correctamente',
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    
    return res.status(500).json({ ok: false, message: 'Error al ajustar balance' });
  }
}

async function updateTransactionStatus(req, res) {
  try {
    const { transactionId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'processing', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ ok: false, message: 'Estado inválido' });
    }

    await pool.query(
      `UPDATE transactions 
       SET status = ?, notes = CONCAT(COALESCE(notes, ''), '\n', ?)
       WHERE transactionId = ?`,
      [status, notes || `Estado cambiado a ${status} por admin`, transactionId]
    );

    await pool.query(
      `INSERT INTO transaction_status_history (transactionId, oldStatus, newStatus, changedBy, notes)
       VALUES (?, (SELECT status FROM transactions WHERE transactionId = ?), ?, ?, ?)`,
      [transactionId, transactionId, status, req.user?.userId || 0, notes]
    );

    return res.json({
      ok: true,
      message: 'Estado actualizado correctamente',
    });
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
  adjustUserBalance,
  updateTransactionStatus,
};
