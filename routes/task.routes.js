const express = require('express');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes are protected - require authentication
router.use(protect);

// Task routes
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/today', taskController.getTodayTasks);
router.get('/:taskId', taskController.getTaskById);
router.patch('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Special task endpoints
router.patch('/:taskId/complete', taskController.completeTask);
router.patch('/:taskId/reopen', taskController.reopenTask);
router.patch('/:taskId/skip', taskController.skipTask);
router.patch('/:taskId/reschedule', taskController.rescheduleTask);

module.exports = router;