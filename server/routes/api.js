const express = require('express');
const router = express.Router();
const config = require('../../config/env');
const aiController = require('../controllers/aiController');
const dataController = require('../controllers/dataController');
const { validateChatPayload, validateToolPayload, validateImagePayload } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

// Health & Public Runtime Configuration (Never exposes secrets!)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    service: 'NOVA AI API',
    timestamp: new Date().toISOString(),
    capabilities: {
      aiConfigured: config.gemini.isConfigured,
      aiModel: config.gemini.isConfigured ? config.gemini.model : null,
      imageConfigured: config.image.isConfigured,
      imageModel: config.image.isConfigured ? config.image.model : null,
      authConfigured: config.supabase.isConfigured
    },
    publicConfig: config.supabase.isConfigured
      ? {
          supabaseUrl: config.supabase.url,
          supabaseAnonKey: config.supabase.anonKey
        }
      : null
  });
});

// AI Endpoints
router.post('/chat', validateChatPayload, aiController.chat);
router.post('/chat/stream', validateChatPayload, aiController.chatStream);
router.post('/tools/:toolName', validateToolPayload, aiController.runTool);
router.post('/images/generate', validateImagePayload, aiController.generateImage);

// Protected Persistence Endpoints (Supabase Authenticated)
router.get('/conversations', requireAuth, dataController.listConversations);
router.post('/conversations', requireAuth, dataController.createConversation);
router.get('/conversations/:id', requireAuth, dataController.getConversation);
router.patch('/conversations/:id', requireAuth, dataController.updateConversation);
router.delete('/conversations/:id', requireAuth, dataController.deleteConversation);

router.get('/workspace', requireAuth, dataController.listWorkspace);
router.post('/workspace', requireAuth, dataController.createWorkspaceItem);
router.patch('/workspace/:id', requireAuth, dataController.updateWorkspaceItem);
router.delete('/workspace/:id', requireAuth, dataController.deleteWorkspaceItem);

router.get('/study-tasks', requireAuth, dataController.listStudyTasks);
router.post('/study-tasks', requireAuth, dataController.createStudyTask);
router.patch('/study-tasks/:id', requireAuth, dataController.updateStudyTask);
router.delete('/study-tasks/:id', requireAuth, dataController.deleteStudyTask);

module.exports = router;
