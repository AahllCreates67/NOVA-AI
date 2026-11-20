require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    isConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here')
  },
  image: {
    provider: process.env.IMAGE_PROVIDER || 'gemini',
    apiKey: process.env.IMAGE_API_KEY || process.env.GEMINI_API_KEY || '',
    model: process.env.IMAGE_MODEL || 'imagen-3.0-generate-002',
    isConfigured: Boolean(
      (process.env.IMAGE_API_KEY && process.env.IMAGE_API_KEY !== 'your_image_provider_api_key_here') ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here' && process.env.IMAGE_API_KEY !== 'disabled')
    )
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    isConfigured: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      !process.env.SUPABASE_URL.includes('your-project-id')
    )
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 120
  }
};

module.exports = config;
