const accountService = require('../services/account.service');
const asyncHandler = require('../utils/asyncHandler');

const accountController = {};

// GET /api/v1/account/export — download own data as JSON file
accountController.exportData = asyncHandler(async (req, res) => {
  const data = await accountService.exportUserData(req.user._id);

  const date = new Date().toISOString().split('T')[0];
  const filename = `journeylog-data-export-${date}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).json(data);
});

// DELETE /api/v1/account — permanently delete own account
accountController.deleteAccount = asyncHandler(async (req, res) => {
  const result = await accountService.deleteAccount(req.user._id, req.body || {});

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
    data: result,
  });
});

module.exports = accountController;
