const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentControllers');
const { authRequired } = require('../middlewares/authMiddleware');

router.post('/create-recharge', authRequired, paymentController.createRechargePreference);
router.post('/create-custom-recharge', authRequired, paymentController.createCustomRecharge);

router.post('/webhook', paymentController.webhook);

router.get('/recharge-success', paymentController.rechargeSuccess);
router.get('/recharge-failure', paymentController.rechargeFailure);
router.get('/recharge-pending', paymentController.rechargePending);
router.get('/packages', authRequired, paymentController.getPackages);

module.exports = router;
