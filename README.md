# MindMap Studio — Client (Frontend)

**Markdown එකක් type කරනකොට, ඒක live mind map / diagram එකක් බවට පත් කරන web app එක.**
වමෙන් Markdown ලියන්න, දකුණෙන් diagram එක real-time එකේම නැවත අඳිනවා. Server
එකක් හෝ AI එකක් නැතුව, සම්පූර්ණ rendering එකම browser එකේදීම සිද්ධ වෙනවා.

> මේක monorepo එකක frontend කොටසයි. Backend එක (passwordless auth + cloud save)
> `mindmapStudio-server` repo එකේ.

**Stack:** React 18 · Vite 5 · Tailwind CSS v4 · markmap · d3 · mermaid

---

## විශේෂාංග (Features)

| විශේෂාංගය | විස්තරය |
|---|---|
| **Live preview** | Keystroke එකක් පාසා (debounced ~180ms) diagram එක නැවත අඳිනවා |
| **Diagram types 5ක්** | Mind map · Tree · Flowchart · Concept · Mermaid |
| **File import** | `.md` · `.txt` · `.html` · `.docx` (Word) · `.pdf` → Markdown බවට convert කරනවා |
| **Export** | SVG · PNG · JPEG විදියට download + clipboard එකට copy |
| **Themes** | Accent colour picker + Dark / Light mode (`localStorage` එකේ save වෙනවා) |
| **Passwordless auth** | Email OTP (6-ඉලක්කම් code) — password නෑ |
| **Cloud save** | Sign in කළාම maps cloud එකේ save + sync වෙනවා |
| **Share links** | Public · Protected (passcode) · One-time (එක පාරයි පෙන්නන්නේ) |
| **Guest mode** | Sign in නැතුවම වැඩ කරනවා — draft එක `localStorage` එකේ |

---

## මූලික logic එක — Markdown කොහොමද diagram එකක් වෙන්නේ?

රහස තියෙන්නේ browser library දෙකක:

1. **Parse** — [`markmap-lib`](https://www.npmjs.com/package/markmap-lib) එකේ `Transformer`
   එක ඔබේ Markdown එක (`#`/`##` headings, nested `-` lists) node tree එකක් බවට හරවනවා.
2. **Render** — [`markmap-view`](https://www.npmjs.com/package/markmap-view) (d3 මත
   හදපු) ඒ tree එක zoom/pan කරන්න පුළුවන් SVG එකක් විදියට අඳිනවා.
3. **Live loop** — keystroke එකක් පාසා (debounce ~180ms) transform එක නැවත run කරලා
   `mm.setData(root)` කරනවා.

සරලම core එක මෙන්න:

```js
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const { root } = new Transformer().transform(markdown);
Markmap.create(svgEl).setData(root);
```

**අනෙක් diagram types** (`tree`, `flow`, `concept`) — ඒවා අපේම **d3 renderers**
(`src/lib/diagrams/`). ඒවා එකම Markdown tree එකම අරගෙන වෙනස් layout වලින් අඳිනවා.
**Mermaid** කියන්නේ `mermaid` library එකෙන් fenced ```` ```mermaid ```` blocks render
කරන එකයි.

---

## Performance — lazy loading

Heavy libraries (markmap, d3, mermaid, pdfjs, mammoth, turndown) **initial load
එකේ නෑ** — ඒවා අවශ්‍ය වෙලාවට විතරක් `import()` වලින් load වෙනවා:

- **Diagram engine** (markmap + d3 ~250KB) → පළවෙනි render එකේදී (`src/lib/diagrams/engine.js`)
- **Mermaid** → mermaid diagram එකක් තියෙනකොට විතරක්
- **pdfjs / mammoth / turndown** → file import කරනකොට විතරක්
- **exportMap** → saved map එකක් PNG download කරනකොට විතරක්

ඒ නිසා **entry bundle එක ~78KB (gzip ~25KB)** විතරයි — editor එක ඉක්මනින් paint වෙනවා,
diagram engine එක පස්සේ background එකේ load වෙනවා.

> **වැදගත්:** Performance මැනල බලන්න `npm run dev` (dev server) **එකේ නෙවෙයි** —
> ඒක unminified. හැමවිටම **production build** එකේ මනින්න:
> `npm run build && npm run preview` → `http://localhost:4173` → Lighthouse.

---

## Run කරන හැටි

Node.js 18+ අවශ්‍යයි.

```bash
npm install
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # production build එක preview → http://localhost:4173
```

### Environment variable

Backend API එකේ address එක `VITE_API_URL` එකෙන් set කරනවා. Set නැත්නම්
`http://localhost:4000/api` වලට default වෙනවා.

```bash
# .env (local) හෝ deploy platform එකේ
VITE_API_URL=https://your-api-domain.com/api
```

---

## Project structure

```
mindmapStudio-client/
├── index.html              # HTML shell — root div + Google Fonts
├── vite.config.js          # Vite + React + Tailwind; React-ට manualChunk එකක්
├── package.json
└── src/
    ├── main.jsx            # React entry. /s/<token> නම් ShareView, නැත්නම් App
    ├── App.jsx             # Root: හැම state එකක්ම, debounce, හැම දෙයක්ම wire කරන තැන
    ├── styles.css          # Design tokens + layout (Tailwind v4, light/dark)
    │
    ├── hooks/
    │   ├── useDiagram.js   # Diagram canvas එක drive කරනවා (lazy engine, update/zoom)
    │   ├── useAuth.js      # OTP session — token restore, requestOtp, verifyOtp, logout
    │   ├── useMindmaps.js  # Cloud maps CRUD + "වෙනස් වුණාද" check එකෙන් save dedupe
    │   ├── useImport.js    # File import flow + preloader control
    │   ├── useTheme.js     # Accent colour + dark/light mode
    │   └── useToast.js     # තාවකාලික status messages (auto-dismiss)
    │
    ├── components/
    │   ├── Toolbar.jsx       # Brand + actions (example/import/copy/download/save/sign-in)
    │   ├── Editor.jsx        # Markdown textarea + char count + clear
    │   ├── MindMap.jsx       # Diagram <svg>/<div> canvas + type tabs + zoom controls
    │   ├── AuthDialog.jsx    # 2-step sign-in dialog (email → OTP code)
    │   ├── OtpInput.jsx      # 6-box segmented OTP input (paste/auto-advance)
    │   ├── AccountMenu.jsx   # Avatar chip + sign-out dropdown
    │   ├── MapsDialog.jsx    # "My maps" — cloud maps list (open/delete/download)
    │   ├── ShareDialog.jsx   # Share link එකක් හදනවා (public/protected/onetime)
    │   ├── ShareView.jsx     # Public viewer (/s/:token) — gate එකක් පෙන්නලා map එක
    │   ├── Preloader.jsx     # Full-screen spinner (import වෙද්දී)
    │   ├── ConfirmDialog.jsx # Delete වගේ දේවල් වලට confirm modal
    │   ├── DownloadButton.jsx# Split button — SVG / PNG / JPEG තෝරන්න
    │   ├── HowDialog.jsx     # "How it works" modal
    │   ├── PasswordInput.jsx # Show/hide toggle එක්ක passcode input
    │   └── Icons.jsx         # Inline SVG icon set
    │
    ├── lib/
    │   ├── api.js           # Backend fetch wrapper + හැම endpoint එකක්ම
    │   ├── auth.js          # Token එක localStorage එකේ තියන තැන
    │   ├── storage.js       # Safe localStorage (block වුණොත් crash වෙන්නේ නෑ)
    │   ├── theme.js         # Colour maths + CSS variable plumbing
    │   ├── importFile.js    # File → Markdown (lazy: turndown/mammoth/pdfjs)
    │   ├── exportMap.js     # Saved map එකක් → PNG (off-screen render, lazy)
    │   ├── exportSvg.js     # Live SVG → standalone SVG/PNG/JPEG + clipboard copy
    │   └── diagrams/
    │       ├── engine.js    # Heavy libs වලට lazy barrel (dynamic import target)
    │       ├── shared.js    # Markdown→tree, zoom, drag, tooltip, colours
    │       ├── tree.js      # d3 left→right tree layout
    │       ├── flow.js      # d3 flowchart layout
    │       ├── concept.js   # d3 concept / radial map
    │       └── mermaid.js   # Mermaid render (lazy-loaded mermaid lib)
    │
    └── data/
        └── examples.js      # Sample documents (readme / plan / trip)
```

---

## Data flow (සාරාංශය)

```
Editor (textarea)
   │  onChange → setMarkdown (App state)
   ▼
App  ── debounce 180ms ──►  useDiagram.update(markdown)
   │                               │
   │                               ├─ mindmap → markmap transform + render
   │                               ├─ tree/flow/concept → d3 renderers
   │                               └─ mermaid → mermaid.render()
   │
   ├─ draft එක localStorage එකේ save (guest mode)
   └─ Sign-in → useMindmaps.save() → backend → MongoDB
```

---

## Deploy

- **Client (මේ repo):** static build එකක් නිසා **Vercel** හෝ **Cloudflare Pages**
  වලට perfect. Build: `npm run build`, Output: `dist`. `VITE_API_URL` env var එක set
  කරන්න. SPA routing (`/s/<token>`) වලට rewrite rule එකක් දාන්න (`/* → /index.html`).
- **Server:** `mindmapStudio-server` repo එක බලන්න.

## License

MIT.
