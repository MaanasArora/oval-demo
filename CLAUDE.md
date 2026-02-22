# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite exists currently.

## Architecture

This is a React + Vite app for exploring [Polis](https://pol.is) conversation data through interactive visualization. All data processing happens in-browser — there is no backend.

### Three-Panel Layout

```
App (central state)
├── Left: CsvUploader (pre-load) | DatasetPanel (post-load)
├── Center: ScatterPlotPanel → ScatterPlot (Plotly)
└── Right: VariablePanel (pre-score) | ScoreExplorer (post-score)
```

### Input Formats

`CsvUploader` supports two formats selected via a toggle:

- **CSV** (default): `comments.csv` + `participant-votes.csv` — written to the Pyodide WASM filesystem and loaded via `oval.io.read_polis()`
- **h5ad**: A single `.h5ad` file — parsed in JS by `src/lib/h5adLoader.js` (using `h5wasm`), then passed to Pyodide as raw arrays via `pyodide.globals`. This path bypasses `read_polis()` and builds a `Conversation` object directly (because h5ad files lack the `author-id` field that `read_polis` requires).

### Data Flow

1. **Load**: User uploads files → `CsvUploader` parses (CSV path: via Pyodide FS + `read_polis`; h5ad path: via `h5adLoader.js` + direct `Conversation` construction in Python) → computes 2D embeddings via `oval.decomposition.decompose_votes()` → embeddings + comments + metadata returned to `App` state.

2. **Variable creation**: User selects "anchor" comments in `DatasetPanel` and rates them (-2 to +2) in `VariablePanel` → `App.computeVariable()` calls `computeVariablePyodide()` in `src/pyodide.js` → Python creates `DiffusionVariable`, fits on anchor ratings, predicts scores for all comments.

3. **Explore**: `ScatterPlot` colors points by score (RdBu colorscale, blue=positive). `ScoreExplorer` lists comments sorted by score.

### Pyodide Integration (`src/pyodide.js`)

Python runs via [Pyodide](https://pyodide.org) (WASM). The module handles:
- Loading Pyodide from CDN (`v0.29.3`)
- Installing pip packages: NumPy, Pandas, Scikit-learn, Pydantic
- Installing the custom `oval` library from `public/oval-0.1.0-py3-none-any.whl`
- Writing CSV files to the WASM in-memory filesystem (`pyodide.FS`)
- Executing Python code strings and returning results

The wheel URL is resolved dynamically — `localhost` dev vs. GitHub Pages deployment (base path `/oval-demo/`).

### h5ad Loading (`src/lib/h5adLoader.js`)

Reads `.h5ad` files using `h5wasm` (browser-native HDF5). Key details:
- `loadH5adFile(buffer)` — reads `/obs` (participants), `/var` (comments + text from `content` or `txt` column), and `/X` (votes matrix). Returns `{ comments, participantIds, commentIds, votesMatrix }`.
- Handles both plain datasets and categorical columns (codes + categories groups).
- The `toCSVBlobs()` export was removed; h5ad data is now passed directly to Pyodide via `pyodide.globals` rather than being round-tripped through CSV.

### Key Python APIs (from the `oval` library)

- `oval.io.read_polis(comments_path, votes_path)` — parse Polis CSVs
- `oval.decomposition.decompose_votes(votes_df)` — compute 2D embeddings
- `oval.variable.DiffusionVariable` — score prediction model; `.fit(anchors_dict)`, `.predict_comments(df)`, `.score_comments(df)`

### State in `App.jsx`

All significant state lives in `App.jsx`:
- `embeddings`, `comments` — loaded data
- `anchors` — `Map<commentId, rating>` for selected anchor comments
- `scores`, `confidence` — output from variable computation
- `selectedComment`, `loaded` — UI state

### Deployment

Hosted on GitHub Pages. Vite base path is `/oval-demo/`. The `oval` wheel is served from `public/`.
