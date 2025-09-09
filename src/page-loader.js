import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import debug from 'debug'
import { promises as fs } from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { makeFilename, makeDirName, makeResourceName, isResource } from './utils.js'

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

const log = debug('page-loader')

const isLocal = (resourceUrl, baseUrl) => {
  const pageHost = new URL(baseUrl).hostname
  const resHost = new URL(resourceUrl, baseUrl).hostname
  return pageHost === resHost
}

const pageLoader = (url, outputDir = process.cwd()) => {
  log(`Start loading page: ${url}`)

  const pageFilename = makeFilename(url)
  const filepath = path.join(outputDir, pageFilename)
  const resourcesDirName = makeDirName(url)
  const resourcesDir = path.join(outputDir, resourcesDirName)

  return fs.access(outputDir, fs.constants.W_OK)
    .catch(() => {
      log(`Directory not writable: ${outputDir}`)
      throw new Error(`Directory not writable: ${outputDir}`)
    })
    .then(() => axios.get(url))
    .then((response) => {
      log(`Page downloaded: ${url}, status: ${response.status}`)

      const $ = cheerio.load(response.data)
      const selectors = [
        { tag: 'img', attr: 'src' },
        { tag: 'link', attr: 'href' },
        { tag: 'script', attr: 'src' },
      ]

      const resourcePromises = []

      selectors.forEach(({ tag, attr }) => {
        $(tag).each((i, el) => {
          const src = $(el).attr(attr)
          if (!src) return

          const resourceUrl = new URL(src, url).toString()

          if (!isLocal(resourceUrl, url) || !isResource(resourceUrl)) {
            log(`Skip external or non-resource: ${resourceUrl}`)
            return
          }

          const resourceFilename = makeResourceName(resourceUrl)
          const resourcePath = path.join(resourcesDir, resourceFilename)

          $(el).attr(attr, path.join(resourcesDirName, resourceFilename))

          log(`Downloading resource: ${resourceUrl} -> ${resourcePath}`)

          const downloadPromise = axios.get(resourceUrl, { responseType: 'arraybuffer' })
            .then((res) => {
              log(`Resource downloaded: ${resourceUrl}, status: ${res.status}`)
              return fs.writeFile(resourcePath, res.data)
            })
            .catch((err) => {
              log(`Failed to download resource: ${resourceUrl}, error: ${err.message}`)
              console.error(`Failed to download resource: ${resourceUrl}`, err.message)
              return null
            })

          resourcePromises.push(downloadPromise)
        })
      })

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => Promise.all(resourcePromises))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => {
          log(`Page successfully saved to: ${filepath}`)
          return filepath
        })
    })
}

export default pageLoader
