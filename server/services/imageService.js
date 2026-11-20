const config = require('../../config/env');
const geminiService = require('./geminiService');
const { AppError } = require('../utils/errors');

const STYLE_MODIFIERS = {
  cinematic: 'cinematic lighting, dramatic atmosphere, ultra-detailed film still, 8k composition',
  'digital-art': 'vibrant digital artwork, intricate concept art, trending digital illustration',
  '3d-render': 'octane 3D render, volumetric lighting, realistic materials, raytraced reflections',
  illustration: 'editorial vector and hand-crafted illustration, clean linework, rich color harmony',
  minimal: 'minimalist aesthetic, clean negative space, refined geometric balance, modern design',
  fantasy: 'ethereal cosmic fantasy art, mystical luminescence, imaginative world-building',
  photorealistic: 'photorealistic DSLR photography, 85mm lens, natural depth of field, authentic textures'
};

class ImageService {
  isConfigured() {
    return config.image.isConfigured;
  }

  async enhancePrompt(prompt, style) {
    if (!geminiService.client) {
      const styleNote = STYLE_MODIFIERS[style] || '';
      return styleNote ? `${prompt}, ${styleNote}` : prompt;
    }

    const styleDesc = STYLE_MODIFIERS[style] || 'high quality, visually striking';
    const sys = 'You are an expert visual prompt engineer. Expand the user prompt into a vivid, detailed image generation prompt in 1-2 sentences. Output ONLY the enhanced prompt text without quotes or commentary.';
    const res = await geminiService.generateSinglePrompt(
      `Original prompt: "${prompt}"
Desired style: ${style} (${styleDesc})`,
      sys
    );
    return res.text.trim();
  }

  async generateImage({ prompt, style = 'cinematic', aspectRatio = '1:1', enhance = false }) {
    if (!this.isConfigured()) {
      throw new AppError(
        'Image generation provider is not configured. Set IMAGE_API_KEY (or GEMINI_API_KEY with Imagen access) in .env.',
        503,
        'IMAGE_PROVIDER_NOT_CONFIGURED'
      );
    }

    let finalPrompt = prompt.trim();
    if (enhance) {
      finalPrompt = await this.enhancePrompt(finalPrompt, style);
    } else if (STYLE_MODIFIERS[style]) {
      finalPrompt = `${finalPrompt}, ${STYLE_MODIFIERS[style]}`;
    }

    // Call Google Imagen 3 REST endpoint using server-side API key
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.image.model)}:predict?key=${encodeURIComponent(config.image.apiKey)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: finalPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const apiMsg = data?.error?.message || 'Image provider rejected the request.';
        if (response.status === 429) {
          throw new AppError('Image generation rate limit reached. Please retry shortly.', 429, 'IMAGE_RATE_LIMIT');
        }
        throw new AppError(
          `Image generation failed: ${apiMsg}`,
          response.status >= 400 && response.status < 500 ? response.status : 502,
          'IMAGE_GENERATION_FAILED'
        );
      }

      const prediction = data?.predictions?.[0];
      if (!prediction || !prediction.bytesBase64Encoded) {
        throw new AppError('No image data returned by the provider.', 502, 'EMPTY_IMAGE_RESPONSE');
      }

      const mimeType = prediction.mimeType || 'image/png';
      const dataUrl = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;

      return {
        imageUrl: dataUrl,
        prompt: prompt.trim(),
        enhancedPrompt: finalPrompt,
        style,
        aspectRatio,
        model: config.image.model
      };
    } catch (err) {
      if (err.isOperational) throw err;
      throw new AppError('Failed to connect to the image generation provider.', 502, 'IMAGE_NETWORK_ERROR');
    }
  }
}

module.exports = new ImageService();
