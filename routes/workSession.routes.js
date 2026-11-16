const express = require('express');
const workSessionController = require('../controllers/workSession.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Work session routes
router.post('/start', workSessionController.startSession);
router.post('/', workSessionController.createSession);

router.get('/', workSessionController.getSessions);
router.get('/today', workSessionController.getTodaySessions);
router.get('/active', workSessionController.getActiveSession);
router.get('/summary/today', workSessionController.getTodaySummary);
router.get('/:sessionId', workSessionController.getSessionById);

router.patch('/:sessionId', workSessionController.updateSession);
router.patch('/:sessionId/stop', workSessionController.stopSession);
router.patch('/:sessionId/cancel', workSessionController.cancelSession);

router.delete('/:sessionId', workSessionController.deleteSession);

// Task work summary route
router.get('/tasks/:taskId/work-summary', workSessionController.getTaskWorkSummary);

module.exports = router;