import { simpleGit } from 'simple-git';
import path from 'path';

export function getGit(repoPath) {
  return simpleGit({ baseDir: path.resolve(repoPath), maxConcurrentProcesses: 4 });
}

export async function getRepoOverview(repoPath) {
  const git = getGit(repoPath);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(`Directory is not a valid git repository: ${repoPath}`);
  }

  const [status, branchSummary, totalCommitsRaw] = await Promise.all([
    git.status(),
    git.branchLocal(),
    git.raw(['rev-list', '--count', 'HEAD']).catch(() => '0')
  ]);

  return {
    repoPath: path.resolve(repoPath),
    repoName: path.basename(path.resolve(repoPath)),
    currentBranch: status.current,
    totalBranches: branchSummary.all.length,
    totalCommits: parseInt(totalCommitsRaw.trim(), 10) || 0,
    clean: status.isClean(),
    modifiedFiles: status.modified.length + status.not_added.length
  };
}

export async function getCommits(repoPath, { limit = 100, branch = null } = {}) {
  const git = getGit(repoPath);
  const options = {
    maxCount: limit,
    format: {
      hash: '%H',
      shortHash: '%h',
      date: '%aI',
      message: '%s',
      author_name: '%an',
      author_email: '%ae',
      parentHashes: '%P'
    }
  };

  if (branch) {
    options.from = branch;
  }

  const logResult = await git.log(options);

  return logResult.all.map(commit => ({
    ...commit,
    parents: commit.parentHashes ? commit.parentHashes.split(' ').filter(Boolean) : []
  }));
}

export async function getBranches(repoPath) {
  const git = getGit(repoPath);
  const branchSummary = await git.branchLocal();
  return {
    current: branchSummary.current,
    all: branchSummary.all,
    branches: branchSummary.branches
  };
}

export async function getFileChurn(repoPath, { top = 20 } = {}) {
  const git = getGit(repoPath);
  try {
    const rawLog = await git.raw([
      'log',
      '--name-only',
      '--pretty=format:',
      '--no-merges'
    ]);

    const lines = rawLog.split('\n').map(l => l.trim()).filter(Boolean);
    const counts = {};

    for (const file of lines) {
      counts[file] = (counts[file] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([filePath, count]) => ({
        path: filePath,
        churnCount: count
      }));

    return sorted;
  } catch {
    return [];
  }
}
