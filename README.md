# GitStory 📖

> **Interactive Repository Chronicle & Timeline Visualizer**

**GitStory** is a lightweight developer tool that transforms any local Git repository into an interactive, visual chronicle. Explore commit histories, observe branch lifespans and merge topologies via custom SVG bezier graphs, inspect commit metadata, and identify file churn hotspots directly in your browser.

---

## ✨ Features

- **Interactive SVG Commit Graph**: Custom lane allocation algorithm with smooth cubic Bézier curves rendering branch merges, forks, and tags without heavy third-party canvas or D3 dependencies.
- **Detailed Commit Inspector**: View full commit SHAs, author details, exact timestamps, formatted messages, and parent commits with one-click jump navigation.
- **Branch & Ref Badges**: Clear visual markers for `HEAD`, branches (`main`, feature branches), and annotated tags.
- **File Churn & Hotspots**: Identifies frequently edited and volatile files across your repository's history to spotlight architectural bottlenecks.
- **Zero-Setup Local Server**: Run as a standalone CLI tool or local dashboard with automated browser launch and fallback states.

---

## 🚀 Quick Start

### 1. Run with `npx` (No installation needed)
```bash
# Inside any Git repository:
npx gitstory

# Or target a specific folder and port:
npx gitstory -d ./my-project -p 4173
```

### 2. Global Installation
```bash
npm install -g gitstory
gitstory
```

### 3. CLI Options
| Flag | Description | Default |
| --- | --- | --- |
| `-d, --dir <path>` | Path to the target Git repository | Current working directory (`.`) |
| `-p, --port <number>` | Port to run the visualizer server on | `4173` |
| `--no-open` | Start server without automatically opening the browser | `false` |
| `-v, --version` | Display version number | `0.1.0` |
| `-h, --help` | Display CLI usage information | &mdash; |

---

## 🛠️ Architecture & Monorepo Structure

```
GitStory/
├── bin/
│   └── gitstory.js          # CLI executable entry point (`gitstory`)
├── server/
│   ├── index.js             # Express 5 server + static client visualizer host
│   └── gitService.js        # Git service wrapper using simple-git
├── client/                  # Frontend single-page app (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── utils/
│   │   │   └── gitGraph.ts  # Topological lane allocation & SVG bezier graph math
│   │   ├── App.tsx          # Main visual chronicle, Inspector & Hotspot tabs
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── package.json             # Root monorepo workspace configuration
└── README.md
```

---

## 💻 Local Development

To contribute or run GitStory from source:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Git](https://git-scm.com/)

### Setup & Run
```bash
# 1. Clone the repository
git clone https://github.com/mackenziebirlymassie-lang/GitStory.git
cd GitStory

# 2. Install dependencies
npm install

# 3. Start development servers (concurrent client & backend with hot reloading)
npm run dev
```

### Building for Production
```bash
# Build the client visualizer bundle
npm run client:build

# Run the local production server
npm start
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
