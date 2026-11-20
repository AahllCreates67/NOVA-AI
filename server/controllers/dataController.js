const { supabaseAdmin } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

// Conversations
async function listConversations(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createConversation(req, res, next) {
  try {
    const title = (req.body.title || 'New Conversation').slice(0, 120);
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ user_id: req.user.id, title })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (convErr || !conv) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');

    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });

    if (msgErr) throw new AppError(msgErr.message, 500, 'DB_ERROR');
    res.json({ success: true, data: { ...conv, messages } });
  } catch (err) {
    next(err);
  }
}

async function updateConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { title, messages } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title && typeof title === 'string') updates.title = title.trim().slice(0, 120);

    const { data: conv, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !conv) throw new AppError('Conversation not found or access denied.', 404, 'NOT_FOUND');

    if (Array.isArray(messages) && messages.length > 0) {
      const rows = messages.map((m) => ({
        conversation_id: id,
        user_id: req.user.id,
        role: m.role,
        content: m.content
      }));
      const { error: insertErr } = await supabaseAdmin.from('messages').insert(rows);
      if (insertErr) throw new AppError(insertErr.message, 500, 'DB_ERROR');
    }

    res.json({ success: true, data: conv });
  } catch (err) {
    next(err);
  }
}

async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err) {
    next(err);
  }
}

// Workspace Saved Items
async function listWorkspace(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('saved_items')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createWorkspaceItem(req, res, next) {
  try {
    const { type, title, content, metadata, is_favorite } = req.body;
    if (!type || !title || !content) {
      throw new AppError('Type, title, and content are required.', 400, 'INVALID_INPUT');
    }

    const { data, error } = await supabaseAdmin
      .from('saved_items')
      .insert({
        user_id: req.user.id,
        type,
        title: String(title).slice(0, 160),
        content: String(content),
        metadata: metadata || {},
        is_favorite: Boolean(is_favorite)
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateWorkspaceItem(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { updated_at: new Date().toISOString() };
    if (typeof req.body.title === 'string') updates.title = req.body.title.trim().slice(0, 160);
    if (typeof req.body.is_favorite === 'boolean') updates.is_favorite = req.body.is_favorite;

    const { data, error } = await supabaseAdmin
      .from('saved_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) throw new AppError('Item not found.', 404, 'NOT_FOUND');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteWorkspaceItem(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('saved_items')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true, message: 'Workspace item deleted.' });
  } catch (err) {
    next(err);
  }
}

// Study Tasks
async function listStudyTasks(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('study_tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function createStudyTask(req, res, next) {
  try {
    const { subject, task, due_date } = req.body;
    if (!subject || !task) throw new AppError('Subject and task are required.', 400, 'INVALID_INPUT');

    const { data, error } = await supabaseAdmin
      .from('study_tasks')
      .insert({
        user_id: req.user.id,
        subject: String(subject).slice(0, 100),
        task: String(task).slice(0, 300),
        due_date: due_date || null,
        completed: false
      })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function updateStudyTask(req, res, next) {
  try {
    const { id } = req.params;
    const updates = {};
    if (typeof req.body.completed === 'boolean') updates.completed = req.body.completed;
    if (typeof req.body.subject === 'string') updates.subject = req.body.subject.slice(0, 100);
    if (typeof req.body.task === 'string') updates.task = req.body.task.slice(0, 300);
    if (req.body.due_date !== undefined) updates.due_date = req.body.due_date || null;

    const { data, error } = await supabaseAdmin
      .from('study_tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !data) throw new AppError('Task not found.', 404, 'NOT_FOUND');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteStudyTask(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('study_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) throw new AppError(error.message, 500, 'DB_ERROR');
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  listWorkspace,
  createWorkspaceItem,
  updateWorkspaceItem,
  deleteWorkspaceItem,
  listStudyTasks,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask
};
