#!/usr/bin/env node
import { Command } from 'commander'
import process from 'process'

const program = new Command()

program
  .name('page-loader')
  .description('Page loader utility')
  .version('0.0.1')
  .option('-o --output [dir]', 'output dir', process.cwd())
  .argument('<url>', 'URL to download')

program.parse(process.argv)
