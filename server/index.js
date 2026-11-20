const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render / reverse proxies
app.set('trust proxy', 1);

// Security headers (allow Google Fonts & Supabase/CDN scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"]
      }
    }
  })
);

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true
  })
);

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP. Please pause briefly and retry.'
    }
  }
});

app.use('/api', apiLimiter);
app.use('/api', apiRoutes);

// Serve static frontend files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// SPA fallback for client-side routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: { code: 'ENDPOINT_NOT_FOUND', message: 'API endpoint does not exist.' }
    });
  }
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`
✦ NOVA AI Server running on http://localhost:${config.port}`);
  console.log(`  Environment : ${config.nodeEnv}`);
  console.log(`  Gemini AI   : ${config.gemini.isConfigured ? `Configured (${config.gemini.model})` : 'Not configured (set GEMINI_API_KEY)'}`);
  console.log(`  Image Gen   : ${config.image.isConfigured ? `Configured (${config.image.model})` : 'Not configured (set IMAGE_API_KEY)'}`);
  console.log(`  Supabase    : ${config.supabase.isConfigured ? 'Configured' : 'Local Development Mode (set SUPABASE_URL & SUPABASE_ANON_KEY)'}
`);
});
