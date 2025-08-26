import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { makeFilename, makeDirName, makeResourceName } from './utils.js'

const isLocal = (resourceUrl, baseUrl) => {
  const pageHost = new URL(baseUrl).hostname
  const resHost = new URL(resourceUrl, baseUrl).hostname
  return pageHost === resHost
}

const pageLoader = (url, outputDir = process.cwd()) => {
  const pageFilename = makeFilename(url)
  const filepath = path.join(outputDir, pageFilename)
  const resourcesDir = path.join(outputDir, makeDirName(url))

  return axios.get(url)
    .then((response) => {
      const $ = cheerio.load(response.data)

      const selectors = [
        { tag: 'img', attr: 'src' },
        { tag: 'link', attr: 'href' },
        { tag: 'script', attr: 'src' },
      ]

      const resourcePromises = selectors.flatMap(({ tag, attr }) =>
        $(tag).map((i, el) => {
          const src = $(el).attr(attr)
          if (!src) return null

          const resourceUrl = new URL(src, url).toString()

          if (!isLocal(resourceUrl, url)) return null

          const resourceFilename = makeResourceName(resourceUrl)
          const resourcePath = path.join(resourcesDir, resourceFilename)

          $(el).attr(attr, `${makeDirName(url)}/${resourceFilename}`)

          return axios.get(resourceUrl, { responseType: 'arraybuffer' })
            .then(res => fs.writeFile(resourcePath, res.data))
        }).get(),
      )

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => Promise.all(resourcePromises))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => filepath)
    })
}

export default pageLoader
