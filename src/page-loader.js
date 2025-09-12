import axios from 'axios'
import axiosDebug from 'axios-debug-log'
import debug from 'debug'
import { promises as fs } from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import Listr from 'listr'
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
      const $ = cheerio.load(response.data)

      const selectors = [
        { tag: 'img', attr: 'src' },
        { tag: 'link', attr: 'href' },
        { tag: 'script', attr: 'src' },
      ]

      const resources = []
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

          resources.push({ resourceUrl, resourcePath, el, attr, resourceFilename })
        })
      })

      const tasks = new Listr(
        resources.map(({ resourceUrl, resourcePath, el, attr, resourceFilename }) => ({
          title: `Downloading: ${resourceUrl}`,
          task: () =>
            axios.get(resourceUrl, { responseType: 'arraybuffer' })
              .then((res) => {
                if (res.status !== 200) {
                  throw new Error(`Unexpected status code ${res.status} for ${resourceUrl}`)
                }
                return fs.writeFile(resourcePath, res.data)
              })
              .then(() => {
                $(el).attr(attr, path.join(resourcesDirName, resourceFilename))
              })
              .catch((err) => {
                throw new Error(`Failed to download resource ${resourceUrl}: ${err.message}`)
              }),
        })),
        { concurrent: true },
      )

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => tasks.run())
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
