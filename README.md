# MarkMind — Client (Frontend)

**Turn Markdown into live, interactive mind maps and diagrams — right in your browser.**
Type Markdown on the left, and watch the diagram redraw in real time on the right.
All rendering happens entirely in the browser — no server round-trip, no AI.

🔗 **Live app:** https://mindmap-studio-client.vercel.app

<img width="1672" height="941" alt="MarkMind screenshot" src="https://github.com/user-attachments/assets/ecb56912-915e-4436-b7b9-a0c7da6a3c59" />

> This is the **frontend** of a two-repo project. The backend (passwordless auth,
> cloud save, and share links) lives in the **`mindmap-studio-server`** repo.

**Tech:** React 18 · Vite 5 · Tailwind CSS v4 · markmap · D3.js · Mermaid

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live preview** | The diagram redraws as you type (debounced ~180 ms) |
| **5 diagram types** | Mind map · Tree · Flowchart · Concept map · Mermaid |
| **File import** | Drop in `.md`, `.txt`, `.html`, `.docx` (Word), or `.pdf` — auto-converted to Markdown |
| **Export** | Download as SVG, PNG, or JPEG — or copy straight to the clipboard |
| **Themes** | Accent-color picker + Dark / Light mode (saved in `localStorage`) |
| **Passwordless auth** | Sign in with a 6-digit email code (OTP) — no passwords |
| **Cloud save** | Signed-in users’ maps are saved and synced to the cloud |
| **Share links** | Share a map as Public, Passcode-protected, or One-time view |
| **Guest mode** | Works fully without signing in — your draft is kept in `localStorage` |

---

## 🚀 How to Use

### 1. Write and preview
Type Markdown in the left editor. The diagram on the right updates live.
MarkMind understands headings (`#`, `##`, `###`) and nested bullet lists (`-`):

```markdown
# My Project
## Features
- Fast
- Simple
## Roadmap
- v1 launch
- v2 polish
```

### 2. Switch the diagram style
Use the tabs above the canvas to render the same Markdown as a **Mind map**,
**Tree**, **Flowchart**, **Concept** map, or **Mermaid** diagram. Scroll to zoom,
drag to pan, and drag individual nodes to rearrange them.

### 3. Import an existing document
Click **Import** and choose a `.md`, `.txt`, `.html`, `.docx`, or `.pdf` file.
MarkMind converts it to Markdown and builds a diagram from it automatically.

### 4. Export or copy
Use **Copy SVG / Copy PNG** to copy the diagram to your clipboard, or the
**Download** button to save it as SVG, PNG, or JPEG.

### 5. Sign in & save to the cloud (optional)
Click **Sign in**, enter your email, and you’ll receive a 6-digit code — enter it
to sign in (no password needed). Once signed in you can **Save** maps to the
cloud and reopen them later from **My maps**. Without signing in, everything still
works and your current draft is kept locally (guest mode).

### 6. Share a map
Open a saved map’s **Share** action and pick a mode:
- **Public** — anyone with the link can view it
- **Protected** — viewers must enter a passcode you set
- **One-time** — the link works exactly once, then expires

Shared maps open at `/s/<token>` in a read-only viewer.

---

## 🧠 How It Works

The core engine is two small browser libraries — no server, no AI:

1. **Parse** — [`markmap-lib`](https://www.npmjs.com/package/markmap-lib)’s `Transformer`
   turns your Markdown (headings + nested lists) into a tree of nodes.
2. **Render** — [`markmap-view`](https://www.npmjs.com/package/markmap-view) (built on
   D3) draws that tree as a zoomable, pannable SVG.
3. **Live loop** — on every keystroke (debounced ~180 ms) the transform re-runs and
   the view updates.

The minimal core looks like this:

```js
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const { root } = new Transformer().transform(markdown);
Markmap.create(svgEl).setData(root);
```

The other diagram types (`tree`, `flow`, `concept`) are **custom D3 renderers** in
`src/lib/diagrams/` that take the same parsed tree and draw it with a different
layout. **Mermaid** renders fenced ```` ```mermaid ```` blocks via the `mermaid` library.

### Data flow

```
Editor (textarea)
   │  onChange → setMarkdown (App state)
   ▼
App  ── debounce 180ms ──►  useDiagram.update(markdown)
   │                               ├─ mindmap → markmap transform + render
   │                               ├─ tree / flow / concept → D3 renderers
   │                               └─ mermaid → mermaid.render()
   │
   ├─ draft saved to localStorage (guest mode)
   └─ signed in → useMindmaps.save() → backend API → MongoDB
```

---

## 🛠️ Getting Started (local development)

Requires **Node.js 18+**.

```bash
npm install
npm run dev      # dev server  → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build → http://localhost:4173
```

### Configuration

The frontend talks to the backend via a single environment variable. If it isn’t
set, it defaults to `http://localhost:4000/api` (handy for local development).

```bash
# .env (local) — or set it in your deploy platform
VITE_API_URL=https://your-api-domain.com/api
```

> Auth, cloud save, and share links require the backend to be running. Diagram
> rendering, import, and export work with no backend at all.

---

## ⚡ Performance

Heavy libraries (markmap, D3, Mermaid, pdfjs, mammoth, turndown) are **not** in the
initial load — they’re loaded on demand with dynamic `import()`:

- **Diagram engine** (markmap + D3, ~250 KB) → on the first render (`src/lib/diagrams/engine.js`)
- **Mermaid** → only when a Mermaid diagram is present
- **pdfjs / mammoth / turndown** → only when importing a file
- **exportMap** → only when downloading a saved map as PNG

As a result the entry bundle is just **~78 KB (~25 KB gzipped)** — the editor paints
fast while the diagram engine loads in the background.

> **Measuring Lighthouse:** benchmark the **production** build, not the dev server
> (which is unminified): `npm run build && npm run preview` → http://localhost:4173.

---

## 📁 Project Structure

```
mindmap-studio-client/
├── index.html              # HTML shell — root div + Google Fonts
├── vite.config.js          # Vite + React + Tailwind; manualChunk for React
├── vercel.json             # SPA rewrite so /s/<token> deep links work
├── package.json
└── src/
    ├── main.jsx            # React entry; routes /s/<token> → ShareView, else App
    ├── App.jsx             # Root: all state, debounce, and wiring
    ├── styles.css          # Design tokens + layout (Tailwind v4, light/dark)
    │
    ├── hooks/
    │   ├── useDiagram.js   # Drives the diagram canvas (lazy engine, update/zoom)
    │   ├── useAuth.js      # OTP session — restore token, requestOtp, verifyOtp, logout
    │   ├── useMindmaps.js  # Cloud maps CRUD + save de-duplication
    │   ├── useImport.js    # File import flow + preloader control
    │   ├── useTheme.js     # Accent color + dark/light mode
    │   └── useToast.js     # Transient status messages (auto-dismiss)
    │
    ├── components/
    │   ├── Toolbar.jsx       # Brand + actions (example/import/copy/download/save/sign-in)
    │   ├── Editor.jsx        # Markdown textarea + char count + clear
    │   ├── MindMap.jsx       # Diagram canvas + type tabs + zoom controls
    │   ├── AuthDialog.jsx    # 2-step sign-in dialog (email → OTP code)
    │   ├── OtpInput.jsx      # 6-box segmented OTP input (paste / auto-advance)
    │   ├── AccountMenu.jsx   # Avatar chip + sign-out dropdown
    │   ├── MapsDialog.jsx    # "My maps" — cloud maps list (open/delete/download)
    │   ├── ShareDialog.jsx   # Create a share link (public/protected/onetime)
    │   ├── ShareView.jsx     # Public viewer (/s/:token) — gate, then the map
    │   ├── Preloader.jsx     # Full-screen spinner (during import)
    │   ├── ConfirmDialog.jsx # Confirm modal for destructive actions
    │   ├── DownloadButton.jsx# Split button — choose SVG / PNG / JPEG
    │   ├── HowDialog.jsx     # "How it works" modal
    │   ├── PasswordInput.jsx # Passcode input with show/hide toggle
    │   └── Icons.jsx         # Inline SVG icon set
    │
    ├── lib/
    │   ├── api.js           # Backend fetch wrapper + all endpoints
    │   ├── auth.js          # Token storage (localStorage)
    │   ├── storage.js       # Safe localStorage (never crashes if blocked)
    │   ├── theme.js         # Color math + CSS-variable plumbing
    │   ├── importFile.js    # File → Markdown (lazy: turndown/mammoth/pdfjs)
    │   ├── exportMap.js     # Saved map → PNG (off-screen render, lazy)
    │   ├── exportSvg.js     # Live SVG → standalone SVG/PNG/JPEG + clipboard
    │   └── diagrams/
    │       ├── engine.js    # Lazy barrel for the heavy render libraries
    │       ├── shared.js    # Markdown→tree, zoom, drag, tooltip, colors
    │       ├── tree.js      # D3 left→right tree layout
    │       ├── flow.js      # D3 flowchart layout
    │       ├── concept.js   # D3 concept / radial map
    │       └── mermaid.js   # Mermaid render (lazy-loaded)
    │
    └── data/
        └── examples.js      # Sample documents (readme / plan / trip)
```

**Design principle:** UI (`components/`) and logic (`hooks/`, `lib/`) are kept
separate. Components never call `fetch` or touch `localStorage` directly — they go
through `lib/api.js` and `lib/storage.js`, keeping each module single-purpose and
easy to test.

---

## ☁️ Deployment

- **Frontend (this repo):** a static build — deploys cleanly to **Vercel** or
  **Cloudflare Pages**. Build command `npm run build`, output directory `dist`.
  Set `VITE_API_URL`, and add an SPA rewrite (`/* → /index.html`) so share-link
  deep routes work — already configured in [`vercel.json`](vercel.json).
- **Backend:** see the **`mindmap-studio-server`** repo.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.
