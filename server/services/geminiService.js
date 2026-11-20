const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config/env');
const { AppError } = require('../utils/errors');

const SYSTEM_INSTRUCTION = `You are NOVA AI ("Intelligence Beyond Imagination"), an advanced, thoughtful, creative, and helpful AI platform designed & developed by Aahil Shams.
Provide clear, well-structured, accurate, and insightful responses. Use Markdown formatting cleanly (headings, bullet lists, code blocks with language tags) when helpful.`;

class GeminiService {
  constructor() {
    this.client = config.gemini.isConfigured
      ? new GoogleGenerativeAI(config.gemini.apiKey)
      : null;
    this.modelName = config.gemini.model;
  }

  ensureConfigured() {
    if (!this.client) {
      throw new AppError(
        'Gemini API key is not configured on the server. Add GEMINI_API_KEY to your .env file to enable live AI responses.',
        503,
        'AI_PROVIDER_NOT_CONFIGURED'
      );
    }
  }

  formatHistory(history = []) {
    return history
      .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant') && msg.content)
      .slice(-20)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content) }]
      }));
  }

  async generateChatResponse({ message, history = [], systemInstruction = SYSTEM_INSTRUCTION }) {
    this.ensureConfigured();

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction
      });

      const chat = model.startChat({
        history: this.formatHistory(history)
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return {
        text: response.text(),
        model: this.modelName
      };
    } catch (err) {
      this.handleProviderError(err);
    }
  }

  async streamChatResponse({ message, history = [], onChunk, signal }) {
    this.ensureConfigured();

    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const chat = model.startChat({
        history: this.formatHistory(history)
      });

      const result = await chat.sendMessageStream(message);
      let fullText = '';

      for await (const chunk of result.stream) {
        if (signal && signal.aborted) {
          break;
        }
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          onChunk(chunkText);
        }
      }

      return { text: fullText, model: this.modelName };
    } catch (err) {
      this.handleProviderError(err);
    }
  }

  async generateSinglePrompt(prompt, systemInstruction = SYSTEM_INSTRUCTION, jsonMode = false) {
    this.ensureConfigured();

    try {
      const generationConfig = jsonMode
        ? { responseMimeType: 'application/json' }
        : undefined;

      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction,
        generationConfig
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return {
        text: response.text(),
        model: this.modelName
      };
    } catch (err) {
      this.handleProviderError(err);
    }
  }

  handleProviderError(err) {
    const msg = err?.message || '';
    if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('403')) {
      throw new AppError('Invalid AI provider API key. Please check GEMINI_API_KEY configuration.', 502, 'AI_AUTH_ERROR');
    }
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      throw new AppError('AI provider rate limit or quota reached. Please wait a moment and try again.', 429, 'AI_RATE_LIMITED');
    }
    if (msg.includes('SAFETY')) {
      throw new AppError('The request could not be completed due to content safety filters.', 400, 'CONTENT_FILTERED');
    }
    throw new AppError('AI provider request failed. Verify your network and API configuration.', 502, 'AI_PROVIDER_ERROR');
  }
}

module.exports = new GeminiService();
