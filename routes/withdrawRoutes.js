const express = require('express');
const router = express.Router();
const withdrawController = require('../controllers/withdrawController');
const { authRequired } = require('../middlewares/authMiddleware');

router.get('/methods', authRequired, withdrawController.getPaymentMethods);
router.post('/methods', authRequired, withdrawController.savePaymentMethod);
router.delete('/methods/:methodId', authRequired, withdrawController.deletePaymentMethod);

router.post('/bank', authRequired, withdrawController.requestBankWithdrawal);
router.post('/crypto', authRequired, withdrawController.requestCryptoWithdrawal);

router.get('/history', authRequired, withdrawController.getTransactionHistory);
router.get('/transaction/:id', authRequired, withdrawController.getTransactionDetails);

module.exports = router;
