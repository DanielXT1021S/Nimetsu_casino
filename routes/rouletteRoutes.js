const express = require('express');
const router = express.Router();
const { authRequired } = require('../middlewares/authMiddleware');
const rouletteController = require('../controllers/rouletteController');

router.post('/init', authRequired, rouletteController.initGame);
router.post('/addBet', authRequired, rouletteController.addBet);
router.post('/bet', authRequired, rouletteController.bet);
router.post('/spin', authRequired, rouletteController.spin);
router.get('/wheelInfo', authRequired, rouletteController.getWheelInfo);

module.exports = router;
