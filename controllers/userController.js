'use strict';

const pool = require('../config/db');

async function getProfile(req, res) {
  try {
    const { userId } = req.user;

    const [balanceRows] = await pool.query(
      'SELECT balance FROM balances WHERE userId = ? LIMIT 1',
      [userId]
    );

    let balance = 0;
    if (balanceRows.length > 0) {
      balance = balanceRows[0].balance;
    }

    const [statsRows] = await pool.query(
      `SELECT 
        COUNT(*) as totalGames,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as totalWins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as totalLosses,
        SUM(CASE WHEN result = 'tie' THEN 1 ELSE 0 END) as totalTies,
        SUM(winAmount - betAmount) as totalEarnings,
        SUM(betAmount) as totalBet,
        SUM(winAmount) as totalWon
      FROM game_history 
      WHERE userId = ?`,
      [userId]
    );

    const stats = statsRows[0] || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalTies: 0,
      totalEarnings: 0,
      totalBet: 0,
      totalWon: 0
    };

    return res.json({
      ok      : true,
      user    : req.user,
      balance : balance,
      stats   : stats
    });
  } catch (err) {
    return res.status(500).json({
      ok     : false,
      message: 'Error al obtener perfil',
    });
  }
}

async function getGameHistory(req, res) {
  try {
    const { userId } = req.user;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const gameType = req.query.gameType;

    let query = `
      SELECT 
        id,
        gameType,
        betAmount,
        winAmount,
        result,
        gameData,
        createdAt
      FROM game_history
      WHERE userId = ?
    `;

    const params = [userId];

    if (gameType) {
      query += ' AND gameType = ?';
      params.push(gameType);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [games] = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM game_history WHERE userId = ?';
    const countParams = [userId];
    
    if (gameType) {
      countQuery += ' AND gameType = ?';
      countParams.push(gameType);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = countRows[0].total;

    return res.json({
      ok: true,
      games: games,
      pagination: {
        total: total,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < total
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener historial'
    });
  }
}

async function saveGameResult(userId, gameType, betAmount, winAmount, result, gameData = null) {
  try {
    const [insertResult] = await pool.query(
      `INSERT INTO game_history (userId, gameType, betAmount, winAmount, result, gameData)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, gameType, betAmount, winAmount, result, gameData ? JSON.stringify(gameData) : null]
    );

    return { ok: true, id: insertResult.insertId };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  getProfile,
  getGameHistory,
  saveGameResult
};
