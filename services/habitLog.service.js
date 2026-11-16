const HabitLog = require('../models/habitLog.model');
const { validateHabitLogUpdate } = require('../validators/habit.validator');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');

const habitLogService = {};

habitLogService.updateHabitLog = async (userId, habitId, logId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(habitId) || !mongoose.Types.ObjectId.isValid(logId)) {
    const error = new Error('Invalid habit ID or log ID');
    error.statusCode = 400;
    throw error;
  }

  const habitLog = await HabitLog.findOne({
    _id: logId,
    habit: habitId,
    user: userId
  });

  if (!habitLog) {
    return null;
  }

  // Update allowed fields
  const allowedUpdates = [
    'value', 'note', 'status', 'skipReason'
  ];

  const updateObject = {};

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      updateObject[field] = updateData[field];
    }
  }

  // Handle completedAt based on status
  if (updateData.status === 'completed' || updateData.status === 'partial') {
    updateObject.completedAt = new Date();
  } else if (updateData.status === 'skipped') {
    updateObject.completedAt = undefined;
  }

  // Handle skipReason based on status
  if (updateData.status !== 'skipped') {
    updateObject.skipReason = undefined;
  }

  const updatedHabitLog = await HabitLog.findOneAndUpdate(
    {
      _id: logId,
      habit: habitId,
      user: userId
    },
    { $set: updateObject },
    { new: true, runValidators: true }
  );

  return updatedHabitLog;
};

habitLogService.deleteHabitLog = async (userId, habitId, logId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId) || !mongoose.Types.ObjectId.isValid(logId)) {
    const error = new Error('Invalid habit ID or log ID');
    error.statusCode = 400;
    throw error;
  }

  const result = await HabitLog.deleteOne({
    _id: logId,
    habit: habitId,
    user: userId
  });

  return result.deletedCount > 0;
};

habitLogService.getHabitLogById = async (userId, habitId, logId) => {
  if (!mongoose.Types.ObjectId.isValid(habitId) || !mongoose.Types.ObjectId.isValid(logId)) {
    return null;
  }

  return await HabitLog.findOne({
    _id: logId,
    habit: habitId,
    user: userId
  });
};

module.exports = habitLogService;