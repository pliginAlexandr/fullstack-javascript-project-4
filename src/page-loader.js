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
    .catch(() => Promise.reject(new Error(`Directory not writable or does not exist: ${outputDir}`)))
    .then(() => axios.get(url))
    .catch((err) => {
      if (err.response) {
        return Promise.reject(new Error(`Failed to load page ${url}. HTTP status: ${err.response.status}`))
      }
      return Promise.reject(new Error(`Network error while loading ${url}: ${err.message}`))
    })
    .then((response) => {
      log(`Page downloaded: ${url}, status: ${response.status}`)
      const $ = cheerio.load(response.data)

      const selectors = [
        { tag: 'img', attr: 'src' },
        { tag: 'link', attr: 'href' },
        { tag: 'script', attr: 'src' },
      ]

      // Создаём папку ресурсов заранее
      const createResourcesDir = fs.mkdir(resourcesDir, { recursive: true })

      const resourcePromises = selectors.reduce((acc, { tag, attr }) => {
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

          // Меняем ссылку в HTML на локальную
          $(el).attr(attr, path.join(resourcesDirName, resourceFilename))

          log(`Downloading resource: ${resourceUrl} -> ${resourcePath}`)

          const downloadPromise = createResourcesDir
            .then(() => axios.get(resourceUrl, { responseType: 'arraybuffer' }))
            .then((res) => {
              if (res.status !== 200) {
                return Promise.reject(new Error(`Unexpected status code ${res.status} for resource ${resourceUrl}`))
              }
              return fs.writeFile(resourcePath, res.data)
            })
            .catch(err => Promise.reject(new Error(`Failed to download resource ${resourceUrl}: ${err.message}`)))

          acc.push(downloadPromise)
        })
        return acc
      }, [])

      return Promise.all(resourcePromises)
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => {
          log(`Page successfully saved to: ${filepath}`)
          return filepath
        })
    })
}

export default pageLoader
