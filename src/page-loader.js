import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import debug from 'debug'
import parseResources from './parse-resources.js'
import downloadResources from './download-resources.js'
import { makeFilename, makeDirName } from './utils.js'
import axiosDebug from 'axios-debug-log'

if (process.env.NODE_ENV === 'test') {
  axiosDebug({
    request: (debug, config) => {
      debug('Request', config.method?.toUpperCase(), config.url)
    },
    response: (debug, response) => {
      debug('Response', response.status, response.config.url)
    },
    error: (debug, error) => {
      if (error.response) {
        debug('Error', error.response.status, error.config.url)
      }
      else {
        debug('Network Error', error.message)
      }
    },
  })
  axiosDebug.addLogger(axios)
}

const log = debug('page-loader')

const pageLoader = (url, outputDir = process.cwd()) => {
  log(`Start loading page: ${url}`)

  const pageFilename = makeFilename(url)
  const filepath = path.join(outputDir, pageFilename)
  const resourcesDirName = makeDirName(url)
  const resourcesDir = path.join(outputDir, resourcesDirName)

  return fs
    .access(outputDir, fs.constants.W_OK)
    .catch(() => {
      throw new Error(`Directory not writable or does not exist: ${outputDir}`)
    })
    .then(() => axios.get(url))
    .catch((err) => {
      if (err.response) {
        throw new Error(`Failed to load page ${url}. HTTP status: ${err.response.status}`)
      }
      throw new Error(`Network error while loading ${url}: ${err.message}`)
    })
    .then((response) => {
      log(`Page downloaded: ${url}, status: ${response.status}`)

      const { $, resources } = parseResources(response.data, url, resourcesDirName, resourcesDir, log)

      return fs
        .mkdir(resourcesDir, { recursive: true })
        .then(() => downloadResources(resources, resourcesDirName, log))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => {
          log(`Page successfully saved to: ${filepath}`)
          return filepath
        })
    })
    .catch((err) => {
      throw new Error(`Error saving page or resources: ${err.message}`)
    })
}

export default pageLoader
