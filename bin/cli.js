#!/usr/bin/env node

import pageLoader from '../src/page-loader.js'
import { Command } from 'commander'

const program = new Command()

program
  .name('page-loader')
  .description('Download web page with resources')
  .version('1.0.0')
  .argument('<url>', 'URL to download')
  .option('-o, --output <dir>', 'output directory', process.cwd())
  .helpOption('-h, --help', 'display help for command')
  .action(async (url, options) => {
    try {
      const filepath = await pageLoader(url, options.output)
      console.log(`Page successfully downloaded to: ${filepath}`)
    }
    catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

program.parse()
