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
      parentHashes: '%P',
      refs: '%D'
    }
  };

  try {
    // When a specific branch is requested use it, otherwise use --all to construct the full graph
    const args = branch && branch !== 'all' ? [branch] : ['--all'];
    const logResult = await git.log(args, options);

    return (logResult?.all || []).map(commit => {
      const rawRefs = commit.refs
        ? commit.refs
            .split(',')
            .map(r => r.trim())
            .filter(Boolean)
        : [];

      return {
        ...commit,
        refs: rawRefs,
        parents: commit.parentHashes ? commit.parentHashes.split(' ').filter(Boolean) : []
      };
    });
  } catch (err) {
    // Handle newly initialized or empty repository gracefully
    if (/does not have any commits yet|unknown revision|fatal: your current branch/i.test(err.message)) {
      return [];
    }
    throw err;
  }
}

export async function getBranches(repoPath) {
  const git = getGit(repoPath);
  try {
    const branchSummary = await git.branchLocal();
    return {
      current: branchSummary.current || '',
      all: branchSummary.all || [],
      branches: branchSummary.branches || {}
    };
  } catch {
    return {
      current: '',
      all: [],
      branches: {}
    };
  }
}

export async function getFileChurn(repoPath, { top = 20, maxCommits = 1000 } = {}) {
  const git = getGit(repoPath);
  try {
    const rawLog = await git.raw([
      'log',
      '--name-only',
      '--pretty=format:',
      '--no-merges',
      '-n',
      `${maxCommits}`
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
