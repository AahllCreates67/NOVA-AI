const { AppError } = require('../utils/errors');

function validateChatPayload(req, res, next) {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return next(new AppError('Message cannot be empty.', 400, 'INVALID_INPUT'));
  }

  if (message.length > 16000) {
    return next(new AppError('Message exceeds maximum length of 16,000 characters.', 400, 'PAYLOAD_TOO_LARGE'));
  }

  if (history !== undefined && !Array.isArray(history)) {
    return next(new AppError('History must be an array of message objects.', 400, 'INVALID_HISTORY'));
  }

  next();
}

function validateToolPayload(req, res, next) {
  const { input } = req.body;
  if (!input || typeof input !== 'string' || !input.trim()) {
    return next(new AppError('Please provide input text for the tool.', 400, 'INVALID_INPUT'));
  }
  if (input.length > 20000) {
    return next(new AppError('Input exceeds maximum length of 20,000 characters.', 400, 'PAYLOAD_TOO_LARGE'));
  }
  next();
}

function validateImagePayload(req, res, next) {
  const { prompt, aspectRatio, style } = req.body;
  const allowedRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return next(new AppError('Image prompt is required.', 400, 'INVALID_PROMPT'));
  }
  if (prompt.length > 2000) {
    return next(new AppError('Image prompt must be under 2,000 characters.', 400, 'PROMPT_TOO_LONG'));
  }
  if (aspectRatio && !allowedRatios.includes(aspectRatio)) {
    return next(new AppError(`Unsupported aspect ratio. Allowed: ${allowedRatios.join(', ')}`, 400, 'INVALID_ASPECT_RATIO'));
  }
  if (style && typeof style !== 'string') {
    return next(new AppError('Invalid style parameter.', 400, 'INVALID_STYLE'));
  }
  next();
}

module.exports = {
  validateChatPayload,
  validateToolPayload,
  validateImagePayload
};
