import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { makeFilename, makeDirName, makeResourceName, isResource } from './utils.js'

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
        { tag: 'a', attr: 'href' },
      ]

      const downloadTasks = []

      selectors.forEach(({ tag, attr }) => {
        $(tag).each((i, el) => {
          const raw = $(el).attr(attr)
          if (!raw) return
          if (raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return

          const resourceUrl = new URL(raw, url).toString()

          if (!isLocal(resourceUrl, url) || !isResource(resourceUrl, url)) {
            return
          }

          const resourceFilename = makeResourceName(resourceUrl)
          const resourcePath = path.join(resourcesDir, resourceFilename)

          $(el).attr(attr, path.posix.join(resourcesDirName, resourceFilename))

          downloadTasks.push(() => axios
            .get(resourceUrl, { responseType: 'arraybuffer' })
            .then(res => fs.writeFile(resourcePath, res.data))
            .catch((err) => {
              console.error(`Failed to download resource: ${resourceUrl}`, err.message)
              return null
            }))
        })
      })

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => Promise.all(downloadTasks.map(fn => fn())))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => filepath)
    })
}

export default pageLoader
