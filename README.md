# NOVA AI — Intelligence Beyond Imagination

**Designed & Developed by Aahil Shams**  
**© 2026 Aahil Shams. All Rights Reserved.**

NOVA AI is a full-stack artificial intelligence web application featuring a cinematic cosmic visual identity, an interactive HTML5 Canvas 3D intelligence orb, real-time streaming AI chat powered by Google Gemini, eight specialized AI productivity tools, an Image Studio, a Study Room with self-graded quizzes and flashcards, a personal Workspace vault, and Supabase cloud authentication.

---

## 1. Features

- **Cosmic 3D NOVA Orb**: Interactive multi-layered 3D intelligence sphere with nebula currents, luminous cyan core, orbital rings, star particles, pointer parallax, click energy pulse, and AI-generating states.
- **AI Chat Workspace**: Real-time Server-Sent Events (SSE) streaming chat with conversation history, search, rename, delete confirmation, Markdown & code formatting, copy/regenerate/stop controls, and file context attachment.
- **Discover Tools Suite**:
  1. **AI Writer** (Generate, Improve, Rewrite, Tone control)
  2. **AI Summarizer** (Concise bullets, Executive overview, Detailed breakdown)
  3. **AI Translator** (Multi-language translation with auto-detect)
  4. **AI Brainstorm** (Creative, Startup, Marketing, and Problem-Solving angles)
  5. **AI Explainer** (Beginner, Intermediate, and Deep Technical explanations)
  6. **AI Code Helper** (Explain, Debug, and Refactor code blocks)
  7. **AI Email Assistant** (Draft, Polish, and Condense emails)
  8. **AI Storyteller** (Original genre fiction with atmosphere selection)
- **NOVA Image Studio**: Text-to-image generation via Google Imagen 3 with optional AI prompt enhancement, 7 visual styles, aspect ratio controls (`1:1`, `3:4`, `16:9`), download, and regeneration.
- **NOVA Study Room**: Topic Explainer, Revision Notes Generator, Interactive Multiple-Choice Quiz Engine (with real score calculation & explanations), Flip Flashcards, and Study Task Planner.
- **My Workspace & Settings**: Save, search, filter, favorite, and manage outputs; customize Cosmic Dark / Daylight theme, reduced motion, and Enter-to-send behavior.

---

## 2. Technology Stack

- **Frontend**: HTML5, CSS3 (Custom Properties, Grid, Flexbox, Glassmorphism), Vanilla ES6+ JavaScript, HTML5 Canvas 2D.
- **Backend**: Node.js, Express.js, Helmet security headers, CORS, Express Rate Limit, input validation, centralized error handling.
- **AI & Image Providers**: Google Generative AI SDK (`@google/generative-ai`), Google Imagen 3 REST API.
- **Database & Auth**: Supabase (`@supabase/supabase-js`) with PostgreSQL Row Level Security (RLS), plus transparent Local Development Mode fallback when Supabase credentials are omitted.

---

## 3. Folder Structure

```text
NOVA-AI/
├── config/
│   ├── database.sql          # Supabase PostgreSQL schema & RLS policies
│   └── env.js                # Centralized environment loader & feature flags
├── public/
│   ├── assets/
│   │   └── icons/
│   │       └── nova-logo.svg # Custom NOVA orbital vector emblem
│   ├── css/
│   │   ├── main.css          # Global design tokens, typography & themes
│   │   ├── components.css    # Navigation, hero, orb stage, chat & studio UI
│   │   ├── animations.css    # Keyframes & prefers-reduced-motion rules
│   │   └── responsive.css    # Mobile-first breakpoints (360px to 1440px+)
│   ├── js/
│   │   ├── app.js            # Main bootstrap & hero prompt controller
│   │   ├── auth.js           # Supabase authentication & profile management
│   │   ├── chat.js           # Streaming chat client & conversation manager
│   │   ├── image-studio.js   # Image generation UI & gallery controls
│   │   ├── navigation.js     # Navbar, mobile drawer, modals & safe Markdown
│   │   ├── orb.js            # Cosmic 3D NOVA Orb animation engine
│   │   ├── router.js         # Client-side SPA router
│   │   ├── settings.js       # Theme, motion & chat preferences
│   │   ├── study-room.js     # Explainer, notes, quiz, flashcards & planner
│   │   ├── tools.js          # 8 specialized AI tools & modal runner
│   │   └── workspace.js      # Personal saved items library
│   └── index.html            # Complete semantic single-page application
├── server/
│   ├── controllers/
│   │   ├── aiController.js   # Chat, SSE stream, tools & image endpoints
│   │   └── dataController.js # Protected Supabase CRUD endpoints
│   ├── middleware/
│   │   ├── auth.js           # Supabase JWT verification middleware
│   │   ├── errorHandler.js   # Safe JSON error formatter
│   │   └── validate.js       # Request payload validation
│   ├── routes/
│   │   └── api.js            # REST API route definitions
│   ├── services/
│   │   ├── geminiService.js  # Modular Google Gemini integration
│   │   ├── imageService.js   # Image generation & prompt enhancer
│   │   └── toolService.js    # Reusable prompt builders & JSON study parsers
│   ├── utils/
│   │   └── errors.js         # Operational AppError class
│   └── index.js              # Express server entry point
├── .env.example              # Environment variable template
├── .gitignore
├── LICENSE
├── package.json
├── render.yaml               # Render deployment blueprint
└── README.md
```

---

## 4. Prerequisites

- **Node.js** `v18.0.0` or higher (`node -v`)
- **npm** `v9.0.0` or higher
- A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* A **Supabase** project for cloud authentication and persistent PostgreSQL storage

---

## 5. Installation & Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` and add your credentials:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_actual_gemini_api_key
   GEMINI_MODEL=gemini-2.5-flash

   # Optional: Image Generation (defaults to GEMINI_API_KEY if omitted)
   IMAGE_API_KEY=your_image_api_key
   IMAGE_MODEL=imagen-3.0-generate-002

   # Optional: Supabase Cloud Auth & Persistence
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Configure Supabase Database (if using cloud persistence):**
   - Open your Supabase project dashboard → **SQL Editor**.
   - Paste the contents of `config/database.sql` and click **Run**.
   - This creates `profiles`, `conversations`, `messages`, `saved_items`, `generated_images`, `study_tasks`, and `user_preferences` with strict Row Level Security (RLS).

4. **Start the server:**
   ```bash
   npm start
   ```
   Or with auto-reload during development:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 6. REST API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Server status and non-secret capability flags |
| `POST` | `/api/chat` | Public | Single-turn / multi-turn Gemini chat completion |
| `POST` | `/api/chat/stream` | Public | Server-Sent Events (SSE) streaming chat |
| `POST` | `/api/tools/:toolName` | Public | Execute specialized tools & structured study generators |
| `POST` | `/api/images/generate` | Public | Generate images via Imagen 3 |
| `GET/POST` | `/api/conversations` | Required | List or create user conversations in Supabase |
| `GET/PATCH/DELETE` | `/api/conversations/:id` | Required | Manage owned conversation & messages |
| `GET/POST` | `/api/workspace` | Required | List or save items to user Workspace |
| `PATCH/DELETE` | `/api/workspace/:id` | Required | Update favorite/title or delete owned item |
| `GET/POST` | `/api/study-tasks` | Required | List or create study planner tasks |
| `PATCH/DELETE` | `/api/study-tasks/:id` | Required | Update or delete owned study tasks |

---

## 7. Deploying to Render

1. Push the `NOVA-AI` folder to a GitHub or GitLab repository.
2. In the [Render Dashboard](https://dashboard.render.com/), select **New → Blueprint** (or **New → Web Service**).
3. Render automatically detects `render.yaml`:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add your secret environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IMAGE_API_KEY`) in Render's **Environment** tab.
5. Deploy and verify `https://your-service.onrender.com/api/health`.

---

## 8. Troubleshooting

- **"Gemini API key is not configured on the server"**: Ensure `.env` exists in the project root, `GEMINI_API_KEY` is set without quotes, and restart the Node server.
- **Image Studio returns 403 / model unavailable**: Verify your Google AI Studio API key has billing/access enabled for `imagen-3.0-generate-002`, or update `IMAGE_MODEL` in `.env`.
- **Supabase Auth modal shows Setup Notice**: Both `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be configured in `.env`.

---

© 2026 Aahil Shams. All Rights Reserved.  
Designed & Developed by Aahil Shams.
