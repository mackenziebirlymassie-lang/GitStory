#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { startServer } from '../server/index.js';

const program = new Command();

program
  .name('gitstory')
  .description('Interactive repository chronicle and timeline visualizer')
  .version('0.1.0')
  .option('-p, --port <number>', 'Port to run the visualizer on', '4173')
  .option('-d, --dir <path>', 'Path to target git repository', process.cwd())
  .option('--no-open', 'Do not open the browser automatically')
  .action(async (options) => {
    const targetDir = path.resolve(options.dir);
    const port = parseInt(options.port, 10);
    const shouldOpen = options.open;

    if (!fs.existsSync(targetDir)) {
      console.error(`\n❌ Error: Directory not found: ${targetDir}\n`);
      process.exit(1);
    }

    const stat = fs.statSync(targetDir);
    if (!stat.isDirectory()) {
      console.error(`\n❌ Error: Specified path is not a directory: ${targetDir}\n`);
      process.exit(1);
    }

    try {
      await startServer({
        repoPath: targetDir,
        port,
        openBrowser: shouldOpen
      });
    } catch {
      process.exit(1);
    }
  });

program.parse(process.argv);
