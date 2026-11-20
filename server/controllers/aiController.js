const geminiService = require('../services/geminiService');
const toolService = require('../services/toolService');
const imageService = require('../services/imageService');

async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    const result = await geminiService.generateChatResponse({ message, history });
    res.json({
      success: true,
      data: {
        reply: result.text,
        model: result.model
      }
    });
  } catch (err) {
    next(err);
  }
}

async function chatStream(req, res, next) {
  const { message, history } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  try {
    const result = await geminiService.streamChatResponse({
      message,
      history,
      signal: abortController.signal,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}

`);
      }
    });

    res.write(`data: ${JSON.stringify({ type: 'done', model: result.model })}

`);
    res.end();
  } catch (err) {
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        code: err.code || 'STREAM_ERROR',
        message: err.isOperational ? err.message : 'Streaming interrupted due to server error.'
      })}

`
    );
    res.end();
  }
}

async function runTool(req, res, next) {
  try {
    const { toolName } = req.params;
    const { input, options } = req.body;
    const result = await toolService.executeTool(toolName, { input, options });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function generateImage(req, res, next) {
  try {
    const { prompt, style, aspectRatio, enhance } = req.body;
    const result = await imageService.generateImage({ prompt, style, aspectRatio, enhance });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  chat,
  chatStream,
  runTool,
  generateImage
};
