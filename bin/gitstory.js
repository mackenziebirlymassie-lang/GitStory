#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
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

    await startServer({
      repoPath: targetDir,
      port,
      openBrowser: shouldOpen
    });
  });

program.parse(process.argv);
