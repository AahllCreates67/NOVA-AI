const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/env');
const { AppError } = require('../utils/errors');

let supabaseAdmin = null;
if (config.supabase.isConfigured && config.supabase.serviceRoleKey) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);
} else if (config.supabase.isConfigured) {
  supabaseAdmin = createClient(config.supabase.url, config.supabase.anonKey);
}

async function optionalAuth(req, res, next) {
  req.user = null;
  if (!supabaseAdmin) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data && data.user) {
      req.user = data.user;
    }
  } catch (err) {
    // Ignore invalid optional tokens
  }
  next();
}

async function requireAuth(req, res, next) {
  if (!config.supabase.isConfigured || !supabaseAdmin) {
    return next(
      new AppError(
        'Cloud authentication is not configured on this server. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.',
        503,
        'AUTH_NOT_CONFIGURED'
      )
    );
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data || !data.user) {
      return next(new AppError('Invalid or expired session token.', 401, 'INVALID_TOKEN'));
    }
    req.user = data.user;
    next();
  } catch (err) {
    next(new AppError('Authentication verification failed.', 401, 'AUTH_FAILED'));
  }
}

module.exports = {
  supabaseAdmin,
  optionalAuth,
  requireAuth
};
