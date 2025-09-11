#!/usr/bin/env node

import { Command } from 'commander'
import pageLoader from '../src/page-loader.js'

const program = new Command()

program
  .name('page-loader')
  .description('Downloads a web page and its resources')
  .version('1.0.0')
  .argument('<url>', 'Page URL to download')
  .option('-o, --output [dir]', 'Output directory', process.cwd())
  .helpOption('-h, --help', 'Display help for command')
  .action(async (url, options) => {
    try {
      const filepath = await pageLoader(url, options.output)
      console.log(`Page successfully saved to ${filepath}`)
      process.exit(0)
    }
    catch (err) {
      console.error(`Error: ${err.message}`)
      process.exit(1)
    }
  })

program.parse(process.argv)
