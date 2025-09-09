import axios from 'axios'
import axiosDebug from 'axios-debug-log'
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

const isLocal = (resourceUrl, baseUrl) => {
  const pageHost = new URL(baseUrl).hostname
  const resHost = new URL(resourceUrl, baseUrl).hostname
  return pageHost === resHost
}

const pageLoader = (url, outputDir = process.cwd()) => {
  const pageFilename = makeFilename(url)
  const filepath = path.join(outputDir, pageFilename)
  const resourcesDirName = makeDirName(url)
  const resourcesDir = path.join(outputDir, resourcesDirName)

  return fs.access(outputDir, fs.constants.W_OK)
    .catch(() => {
      throw new Error(`Directory not writable: ${outputDir}`)
    })
    .then(() => axios.get(url))
    .then((response) => {
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
            return
          }

          const resourceFilename = makeResourceName(resourceUrl)
          const resourcePath = path.join(resourcesDir, resourceFilename)

          $(el).attr(attr, path.join(resourcesDirName, resourceFilename))

          const downloadPromise = axios.get(resourceUrl, { responseType: 'arraybuffer' })
            .then(res => fs.writeFile(resourcePath, res.data))
            .catch((err) => {
              console.error(`Failed to download resource: ${resourceUrl}`, err.message)
              return null
            })

          resourcePromises.push(downloadPromise)
        })
      })

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => Promise.all(resourcePromises))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => filepath)
    })
}

export default pageLoader
