const geminiService = require('./geminiService');
const { AppError } = require('../utils/errors');

const TOOL_CONFIGS = {
  writer: {
    name: 'AI Writer',
    buildPrompt: ({ input, options = {} }) => {
      const mode = options.mode || 'generate';
      const tone = options.tone || 'professional';
      return `Task: ${mode} written content.
Tone: ${tone}.
Topic/Draft:
${input}

Provide polished, engaging, well-structured writing.`;
    },
    system: 'You are NOVA AI Writer, a master editorial writer and content strategist.'
  },
  summarizer: {
    name: 'AI Summarizer',
    buildPrompt: ({ input, options = {} }) => {
      const length = options.length || 'concise';
      return `Summarize the following text in a ${length} format. Highlight key takeaways clearly using bullet points and a brief overview.

Text:
${input}`;
    },
    system: 'You are NOVA AI Summarizer. Distill complex texts accurately without inventing facts.'
  },
  translator: {
    name: 'AI Translator',
    buildPrompt: ({ input, options = {} }) => {
      const sourceLang = options.sourceLang || 'Auto-Detect';
      const targetLang = options.targetLang || 'Spanish';
      return `Translate the following text from ${sourceLang} into ${targetLang}. Preserve tone, nuance, and formatting. Provide the translation clearly.

Text:
${input}`;
    },
    system: 'You are NOVA AI Translator, an expert multilingual linguist.'
  },
  brainstorm: {
    name: 'AI Brainstorm',
    buildPrompt: ({ input, options = {} }) => {
      const category = options.category || 'Creative & Strategic';
      return `Generate innovative, actionable ideas around: "${input}" (Focus: ${category}). Group ideas logically, include a brief execution angle for each, and suggest next steps.`;
    },
    system: 'You are NOVA AI Brainstorm, a creative director and innovation strategist.'
  },
  explainer: {
    name: 'AI Explainer',
    buildPrompt: ({ input, options = {} }) => {
      const level = options.level || 'clear and accessible';
      return `Explain the concept "${input}" at a ${level} level. Break it down step-by-step, include a relatable real-world analogy, and give concrete examples.`;
    },
    system: 'You are NOVA AI Explainer, an exceptional educator who makes complex topics intuitive.'
  },
  'code-helper': {
    name: 'AI Code Helper',
    buildPrompt: ({ input, options = {} }) => {
      const action = options.action || 'explain and improve';
      const lang = options.language || 'auto-detected';
      return `Action: ${action} (Language: ${lang}).
Analyze the code or programming question below. Provide clean, well-commented code blocks and clear explanations. Note: Do not claim code was executed.

Input:
${input}`;
    },
    system: 'You are NOVA AI Code Helper, a principal software engineer focused on clean, secure, maintainable code.'
  },
  'email-assistant': {
    name: 'AI Email Assistant',
    buildPrompt: ({ input, options = {} }) => {
      const tone = options.tone || 'professional and warm';
      const action = options.action || 'draft';
      return `Task: ${action} an email.
Tone: ${tone}.
Context/Notes:
${input}

Include a compelling Subject Line and well-structured email body.`;
    },
    system: 'You are NOVA AI Email Assistant, skilled in clear, persuasive professional communication.'
  },
  storyteller: {
    name: 'AI Storyteller',
    buildPrompt: ({ input, options = {} }) => {
      const genre = options.genre || 'Sci-Fi / Cosmic';
      const tone = options.tone || 'immersive and imaginative';
      return `Write an original story based on the premise below.
Genre: ${genre}
Tone: ${tone}
Premise:
${input}

Craft vivid characters, setting, and narrative arc.`;
    },
    system: 'You are NOVA AI Storyteller, an evocative fiction writer.'
  },
  'study-notes': {
    name: 'Study Revision Notes',
    buildPrompt: ({ input, options = {} }) => {
      const subject = options.subject || 'General';
      return `Create structured revision notes for Subject: ${subject}, Topic: "${input}".
Include:
1. Core Overview
2. Key Concepts & Principles
3. Important Definitions
4. Memory Tips / Summary Checklist`;
    },
    system: 'You are NOVA Study Room Tutor. Create structured, accurate academic study notes.'
  },
  'study-quiz': {
    name: 'Study Quiz Generator',
    buildPrompt: ({ input, options = {} }) => {
      const count = Math.min(Math.max(parseInt(options.count, 10) || 5, 3), 10);
      const difficulty = options.difficulty || 'Intermediate';
      return `Generate a ${count}-question multiple-choice quiz on "${input}" at ${difficulty} difficulty.
Return ONLY valid JSON matching this exact schema:
{
  "topic": "${input}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why Option A is correct."
    }
  ]
}`;
    },
    system: 'You are NOVA Quiz Engine. Output strictly valid JSON with accurate educational multiple-choice questions.',
    jsonMode: true
  },
  'study-flashcards': {
    name: 'Study Flashcards Generator',
    buildPrompt: ({ input, options = {} }) => {
      const count = Math.min(Math.max(parseInt(options.count, 10) || 6, 4), 12);
      return `Generate ${count} study flashcards for the topic "${input}".
Return ONLY valid JSON matching this exact schema:
{
  "topic": "${input}",
  "cards": [
    {
      "front": "Term, question, or concept",
      "back": "Clear, concise definition or answer"
    }
  ]
}`;
    },
    system: 'You are NOVA Flashcard Engine. Output strictly valid JSON with high-retention study flashcards.',
    jsonMode: true
  }
};

class ToolService {
  async executeTool(toolName, payload) {
    const tool = TOOL_CONFIGS[toolName];
    if (!tool) {
      throw new AppError(`Unknown tool "${toolName}".`, 404, 'TOOL_NOT_FOUND');
    }

    const prompt = tool.buildPrompt(payload);
    const result = await geminiService.generateSinglePrompt(
      prompt,
      tool.system,
      Boolean(tool.jsonMode)
    );

    if (tool.jsonMode) {
      try {
        const cleaned = String(result.text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleaned);
        return {
          tool: toolName,
          name: tool.name,
          structured: parsed,
          model: result.model
        };
      } catch (e) {
        throw new AppError('AI returned malformed structured study data. Please retry.', 502, 'PARSE_ERROR');
      }
    }

    return {
      tool: toolName,
      name: tool.name,
      output: result.text,
      model: result.model
    };
  }
}

module.exports = new ToolService();
