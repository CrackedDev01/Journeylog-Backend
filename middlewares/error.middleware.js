const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`, err);

  // Default to 500 if statusCode is not set
  const statusCode = err.statusCode || 500;

  // Determine if we're in development or production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Prepare error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }) // Only include stack trace in development
  };

  // Add validation errors if present
  if (err.errors && typeof err.errors === 'object') {
    errorResponse.errors = Object.values(err.errors).map(e => e.message || String(e));
  }

  // Add specific error codes for known error types
  if (err.code) {
    errorResponse.code = err.code;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;