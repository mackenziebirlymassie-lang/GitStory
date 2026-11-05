# GitStory - Interactive Repository Chronicle

> **Category:** Developer Utilities

Visual history explorer for Git repositories, rendering commits, branch lifespans, and file churn on an interactive timeline.

---

## Architecture & Structure

```
GitStory/
├── bin/
│   └── gitstory.js          # CLI executable entry point (`gitstory`)
├── server/
│   ├── index.js             # Express API server + static visualizer host
│   └── gitService.js        # Git analytical service (simple-git wrapper)
├── client/                  # Interactive visualizer (React + TypeScript + Vite)
│   ├── src/
│   │   ├── App.tsx          # Main Chronicle UI, Commit Inspector & Churn views
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── package.json             # Root monorepo workspace & start scripts
└── README.md
```

## Getting Started

### 1. Run via CLI directly in any repo:
```bash
# In your target git repository folder:
node path/to/GitStory/bin/gitstory.js
# Or specify directory
node path/to/GitStory/bin/gitstory.js -d ./my-project -p 4173
```

### 2. Development Mode
To work on both frontend and backend concurrently with hot reloading:
```bash
npm run dev
```

### 3. Build & Production Run
```bash
npm run client:build
npm start
```
