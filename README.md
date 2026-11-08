# MindMap Studio

A Markdown → mind map tool (like [mindmap.site](https://mindmap.site)) built with **React + Vite** and the **markmap** libraries. Type Markdown on the left, watch the mind map redraw live on the right.

## How it works

The engine is two small browser libraries — no server, no AI:

1. **Parse** — [`markmap-lib`](https://www.npmjs.com/package/markmap-lib)'s `Transformer` turns your Markdown (headings `#`/`##`, nested `-` lists) into a tree of nodes.
2. **Render** — [`markmap-view`](https://www.npmjs.com/package/markmap-view) (built on `d3`) draws that tree as a zoomable, pannable SVG.
3. **Live loop** — on every keystroke (debounced ~180ms) it re-runs the transform and calls `mm.setData(root); mm.fit()`.

The core is tiny:

```js
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const { root } = new Transformer().transform(markdown);
Markmap.create(svgEl).setData(root);
```

## Run it

Requires Node.js 18+.

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.jsx                 # state, debounce, wiring
  main.jsx                # React entry
  styles.css              # design tokens + layout (light/dark)
  hooks/
    useMindmap.js         # creates the markmap, exposes update() + zoom helpers
  components/
    Toolbar.jsx           # brand + actions (example / import / copy / download)
    Editor.jsx            # the Markdown textarea
    MindMap.jsx           # the <svg> canvas + zoom controls
    HowDialog.jsx         # the "how it works" modal
    Icons.jsx             # inline SVG icons
  lib/
    exportSvg.js          # serialize the map to a styled, standalone SVG
  data/
    examples.js           # sample documents
```

## Ideas to extend it

- **PNG / clipboard-image export** — rasterize the SVG (note: markmap uses `<foreignObject>`, so a plain canvas export taints; libraries like `html-to-image` handle this).
- **Share via URL** — base64-encode the Markdown into the URL hash and restore it on load.
- **Themes** — a light/dark toggle (the CSS already uses `[data-theme]` tokens; set it on `<html>`).
- **Collapsible nodes, custom colors, KaTeX math / code highlighting** — markmap plugins (`markmap-lib` ships KaTeX, Prism, highlight.js).
- **Persistence** — save documents to `localStorage` or a backend (a Spring Boot API would fit well).
- **File drag-and-drop** onto the editor.

## License

MIT — do whatever you like with it.
