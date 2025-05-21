#!/usr/bin/env node
import { Command } from 'commander';
import pageLoader from '../src/pageLoader.js';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .helpOption('-h, --help', 'display help for command')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")', process.cwd())
  .argument('<url>', 'URL to download')
  .action((url, options) => {
    pageLoader(url, options.output)
      .then((path) => {
        console.log(path);
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      });
  });

program.parse(process.argv);
