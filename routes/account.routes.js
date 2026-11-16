const express = require('express');
const accountController = require('../controllers/account.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All account routes require authentication
router.use(protect);

router.get('/export', accountController.exportData);
router.delete('/', accountController.deleteAccount);

module.exports = router;
