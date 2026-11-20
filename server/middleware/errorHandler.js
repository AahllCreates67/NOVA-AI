const config = require('../../config/env');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.isOperational
    ? err.message
    : 'An unexpected server error occurred. Please try again.';

  if (config.nodeEnv !== 'production') {
    console.error('[NOVA ERROR]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

module.exports = errorHandler;
