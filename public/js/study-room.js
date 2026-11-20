/**
 * NOVA AI — Study Room (Explainer, Notes, Scored Quiz, Flashcards, Planner)
 */
window.NovaStudyRoom = {
  TASKS_KEY: 'nova_study_tasks_v1',
  tasks: [],
  currentQuiz: null,
  flashcards: [],
  cardIndex: 0,
  cardFlipped: false,

  init() {
    // Tab switching
    document.getElementById('studyTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-study-tab]');
      if (!btn) return;
      document.querySelectorAll('#studyTabs .filter-pill').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.getAttribute('data-study-tab');
      document.querySelectorAll('.study-panel').forEach((panel) => {
        panel.style.display = panel.id === `study-panel-${tab}` ? 'flex' : 'none';
      });
    });

    // 1. Topic Explainer
    let explainerText = '';
    document.getElementById('runStudyExplainerBtn')?.addEventListener('click', async () => {
      const subject = document.getElementById('studyExpSubject').value.trim() || 'General';
      const level = document.getElementById('studyExpLevel').value;
      const topic = document.getElementById('studyExpTopic').value.trim();
      if (!topic) return window.NovaUI.toast('Please enter a topic to explain.', 'error');

      const btn = document.getElementById('runStudyExplainerBtn');
      const out = document.getElementById('studyExplainerOutput');
      btn.disabled = true;
      btn.textContent = 'Explaining...';

      try {
        const res = await fetch('/api/tools/explainer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: `${subject}: ${topic}`, options: { level } })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to generate explanation.');
        explainerText = json.data.output;
        out.innerHTML = window.NovaUI.renderMarkdown(explainerText);
        out.style.display = 'block';
        document.getElementById('saveStudyExplainerBtn').style.display = 'inline-flex';
      } catch (err) {
        window.NovaUI.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Explain Topic';
      }
    });

    document.getElementById('saveStudyExplainerBtn')?.addEventListener('click', () => {
      if (!explainerText) return;
      window.NovaWorkspace?.saveItem({
        type: 'study_material',
        title: `Explanation: ${document.getElementById('studyExpTopic').value.trim()}`,
        content: explainerText
      });
    });

    // 2. Revision Notes
    let notesText = '';
    document.getElementById('runStudyNotesBtn')?.addEventListener('click', async () => {
      const subject = document.getElementById('studyNotesSubject').value.trim() || 'General';
      const topic = document.getElementById('studyNotesTopic').value.trim();
      if (!topic) return window.NovaUI.toast('Please enter a topic for revision notes.', 'error');

      const btn = document.getElementById('runStudyNotesBtn');
      const out = document.getElementById('studyNotesOutput');
      btn.disabled = true;
      btn.textContent = 'Generating Notes...';

      try {
        const res = await fetch('/api/tools/study-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: topic, options: { subject } })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Failed to generate notes.');
        notesText = json.data.output;
        out.innerHTML = window.NovaUI.renderMarkdown(notesText);
        out.style.display = 'block';
        document.getElementById('copyStudyNotesBtn').style.display = 'inline-flex';
        document.getElementById('saveStudyNotesBtn').style.display = 'inline-flex';
      } catch (err) {
        window.NovaUI.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Revision Notes';
      }
    });

    document.getElementById('copyStudyNotesBtn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(notesText);
      window.NovaUI.toast('Revision notes copied.', 'success');
    });

    document.getElementById('saveStudyNotesBtn')?.addEventListener('click', () => {
      window.NovaWorkspace?.saveItem({
        type: 'study_material',
        title: `Notes: ${document.getElementById('studyNotesTopic').value.trim()}`,
        content: notesText
      });
    });

    // 3. Quiz Creator
    document.getElementById('generateQuizBtn')?.addEventListener('click', async () => {
      const topic = document.getElementById('quizTopicInput').value.trim();
      if (!topic) return window.NovaUI.toast('Enter a quiz topic first.', 'error');

      const count = document.getElementById('quizCountSelect').value;
      const difficulty = document.getElementById('quizDiffSelect').value;
      const btn = document.getElementById('generateQuizBtn');
      const container = document.getElementById('quizContainer');

      btn.disabled = true;
      btn.textContent = 'Building Quiz...';
      container.innerHTML = '<p style="color:var(--text-secondary);">Generating questions...</p>';

      try {
        const res = await fetch('/api/tools/study-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: topic, options: { count, difficulty } })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Quiz generation failed.');
        this.currentQuiz = json.data.structured;
        this.renderQuiz();
      } catch (err) {
        container.innerHTML = '';
        window.NovaUI.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Generate Quiz';
      }
    });

    // 4. Flashcards
    document.getElementById('generateFlashcardsBtn')?.addEventListener('click', async () => {
      const topic = document.getElementById('flashcardTopicInput').value.trim();
      if (!topic) return window.NovaUI.toast('Enter a topic for flashcards.', 'error');

      const btn = document.getElementById('generateFlashcardsBtn');
      const container = document.getElementById('flashcardsContainer');
      btn.disabled = true;
      btn.textContent = 'Creating Deck...';

      try {
        const res = await fetch('/api/tools/study-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: topic, options: { count: 6 } })
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json?.error?.message || 'Flashcard generation failed.');
        this.flashcards = json.data.structured?.cards || [];
        this.cardIndex = 0;
        this.cardFlipped = false;
        this.renderFlashcard();
      } catch (err) {
        container.innerHTML = '';
        window.NovaUI.toast(err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Deck';
      }
    });

    // 5. Study Planner
    this.loadTasks();
    document.getElementById('studyTaskForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = document.getElementById('taskSubjectInput').value.trim();
      const task = document.getElementById('taskDescInput').value.trim();
      const due_date = document.getElementById('taskDateInput').value;
      if (!subject || !task) return;

      this.tasks.unshift({
        id: 'task_' + Date.now(),
        subject,
        task,
        due_date,
        completed: false
      });
      this.saveTasks();
      this.renderTasks();
      e.target.reset();
    });
  },

  renderQuiz() {
    const container = document.getElementById('quizContainer');
    const questions = this.currentQuiz?.questions || [];
    if (questions.length === 0) return;

    container.innerHTML = `
      <form id="quizAttemptForm" style="display:flex; flex-direction:column; gap:18px;">
        ${questions
          .map(
            (q, qIdx) => `
          <div style="padding:18px; border-radius:16px; background:rgba(8,11,22,0.65); border:1px solid var(--border-subtle);">
            <p style="font-weight:600; margin-bottom:12px;">${qIdx + 1}. ${window.NovaUI.escapeHtml(q.question)}</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${q.options
                .map(
                  (opt, oIdx) => `
                <label style="display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:10px; background:var(--bg-secondary); cursor:pointer;">
                  <input type="radio" name="q_${qIdx}" value="${oIdx}" required />
                  <span>${window.NovaUI.escapeHtml(opt)}</span>
                </label>`
                )
                .join('')}
            </div>
            <div id="quizFeedback_${qIdx}" style="margin-top:10px; font-size:0.88rem; display:none;"></div>
          </div>`
          )
          .join('')}
        <div style="display:flex; align-items:center; gap:16px;">
          <button type="submit" class="btn btn-primary">Submit Quiz</button>
          <div id="quizScoreSummary" style="font-weight:700; font-size:1.05rem;"></div>
        </div>
      </form>`;

    document.getElementById('quizAttemptForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      let score = 0;

      questions.forEach((q, qIdx) => {
        const selected = document.querySelector(`input[name="q_${qIdx}"]:checked`);
        const chosenIdx = selected ? parseInt(selected.value, 10) : -1;
        const isCorrect = chosenIdx === q.correctIndex;
        if (isCorrect) score++;

        const fb = document.getElementById(`quizFeedback_${qIdx}`);
        fb.style.display = 'block';
        fb.style.color = isCorrect ? 'var(--status-success)' : 'var(--status-error)';
        fb.innerHTML = `${isCorrect ? '✓ Correct!' : `✕ Incorrect (Answer: ${window.NovaUI.escapeHtml(q.options[q.correctIndex])})`} — <span style="color:var(--text-secondary);">${window.NovaUI.escapeHtml(q.explanation || '')}</span>`;
      });

      const pct = Math.round((score / questions.length) * 100);
      document.getElementById('quizScoreSummary').textContent = `Score: ${score} / ${questions.length} (${pct}%)`;
    });
  },

  renderFlashcard() {
    const container = document.getElementById('flashcardsContainer');
    if (this.flashcards.length === 0) return;
    const card = this.flashcards[this.cardIndex];

    container.innerHTML = `
      <div class="flashcard-stage">
        <div class="flashcard-inner" id="activeFlashcard" role="button" tabindex="0">
          <span style="font-size:0.76rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent-cyan); margin-bottom:14px;">
            ${this.cardFlipped ? 'Answer / Back' : 'Concept / Front'} · Card ${this.cardIndex + 1} of ${this.flashcards.length}
          </span>
          <p style="font-size:1.25rem; font-weight:600;">
            ${window.NovaUI.escapeHtml(this.cardFlipped ? card.back : card.front)}
          </p>
          <span style="font-size:0.8rem; color:var(--text-muted); margin-top:18px;">Click card to flip</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:16px;">
          <button type="button" class="btn btn-secondary btn-sm" id="prevCardBtn" ${this.cardIndex === 0 ? 'disabled' : ''}>← Previous</button>
          <button type="button" class="btn btn-secondary btn-sm" id="flipCardBtn">Flip Card</button>
          <button type="button" class="btn btn-secondary btn-sm" id="nextCardBtn" ${this.cardIndex === this.flashcards.length - 1 ? 'disabled' : ''}>Next →</button>
        </div>
      </div>`;

    const flip = () => {
      this.cardFlipped = !this.cardFlipped;
      this.renderFlashcard();
    };

    document.getElementById('activeFlashcard')?.addEventListener('click', flip);
    document.getElementById('flipCardBtn')?.addEventListener('click', flip);
    document.getElementById('prevCardBtn')?.addEventListener('click', () => {
      if (this.cardIndex > 0) {
        this.cardIndex--;
        this.cardFlipped = false;
        this.renderFlashcard();
      }
    });
    document.getElementById('nextCardBtn')?.addEventListener('click', () => {
      if (this.cardIndex < this.flashcards.length - 1) {
        this.cardIndex++;
        this.cardFlipped = false;
        this.renderFlashcard();
      }
    });
  },

  loadTasks() {
    try {
      this.tasks = JSON.parse(localStorage.getItem(this.TASKS_KEY) || '[]');
    } catch {
      this.tasks = [];
    }
    this.renderTasks();
  },

  saveTasks() {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(this.tasks));
  },

  renderTasks() {
    const list = document.getElementById('studyTasksList');
    if (!list) return;

    if (this.tasks.length === 0) {
      list.innerHTML = `<div class="empty-state"><p>No study tasks yet. Add your first target above.</p></div>`;
      return;
    }

    list.innerHTML = this.tasks
      .map(
        (t) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:14px; background:rgba(8,11,22,0.65); border:1px solid var(--border-subtle); gap:12px;">
        <label style="display:flex; align-items:center; gap:12px; flex:1; cursor:pointer;">
          <input type="checkbox" data-toggle-task="${t.id}" ${t.completed ? 'checked' : ''} />
          <div style="${t.completed ? 'text-decoration:line-through; opacity:0.55;' : ''}">
            <strong>${window.NovaUI.escapeHtml(t.subject)}:</strong> ${window.NovaUI.escapeHtml(t.task)}
            ${t.due_date ? `<span style="font-size:0.8rem; color:var(--accent-cyan); margin-left:8px;">Due ${t.due_date}</span>` : ''}
          </div>
        </label>
        <button type="button" class="btn btn-ghost btn-sm" data-delete-task="${t.id}" style="color:var(--status-error);">Delete</button>
      </div>`
      )
      .join('');

    list.querySelectorAll('[data-toggle-task]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const task = this.tasks.find((item) => item.id === cb.getAttribute('data-toggle-task'));
        if (task) {
          task.completed = cb.checked;
          this.saveTasks();
          this.renderTasks();
        }
      });
    });

    list.querySelectorAll('[data-delete-task]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.tasks = this.tasks.filter((item) => item.id !== btn.getAttribute('data-delete-task'));
        this.saveTasks();
        this.renderTasks();
      });
    });
  }
};
