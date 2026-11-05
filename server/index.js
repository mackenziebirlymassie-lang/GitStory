import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import open from "open";
import {
  getRepoOverview,
  getCommits,
  getBranches,
  getFileChurn,
} from "./gitService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer({
  repoPath = process.cwd(),
  port = 4173,
  openBrowser = true,
} = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Static files from the built client (or fallback message)
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));

  // API Endpoints
  app.get("/api/overview", async (req, res) => {
    try {
      const overview = await getRepoOverview(repoPath);
      res.json(overview);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/commits", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 100;
      const branch = req.query.branch;
      const commits = await getCommits(repoPath, { limit, branch });
      res.json(commits);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/branches", async (req, res) => {
    try {
      const branches = await getBranches(repoPath);
      res.json(branches);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/churn", async (req, res) => {
    try {
      const churn = await getFileChurn(repoPath);
      res.json(churn);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Client SPA fallback
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) {
        res.status(200).send(`
          <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
            <h2>GitStory Server Active</h2>
            <p>Target repository: <code>${repoPath}</code></p>
            <p>Run <code>npm run client:dev</code> or <code>npm run client:build</code> to serve the full visualizer.</p>
          </div>
        `);
      }
    });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`\n📖 GitStory running at: ${url}`);
      console.log(`📁 Analyzing repo: ${repoPath}\n`);
      if (openBrowser) {
        open(url).catch(() => {});
      }
      resolve(server);
    });
  });
}

// If executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer({ repoPath: process.cwd(), port: 4173, openBrowser: false });
}
