// routes/slotsRoutes.js

const express          = require('express');
const slotsController  = require('../controllers/slotsController');
const { authRequired } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/init',  authRequired, slotsController.initSlots);
router.post('/spin', authRequired, slotsController.spinSlots);
router.get('/info',  authRequired, slotsController.slotsInfo);

module.exports = router;
