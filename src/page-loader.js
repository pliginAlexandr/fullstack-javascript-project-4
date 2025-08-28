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
  return fs.access(outputDir, fs.constants.W_OK)
    .catch(() => {
      throw new Error(`Directory not writable: ${outputDir}`)
    })
    .then(() => {
      const pageFilename = makeFilename(url) 
      const filepath = path.join(outputDir, pageFilename) 
      const resourcesDirName = makeDirName(url) 
      const resourcesDir = path.join(outputDir, resourcesDirName)

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

              if (!isLocal(resourceUrl, url) || !isResource(resourceUrl, url)) {
                return null
              }

              const resourceFilename = makeResourceName(resourceUrl)
              const resourcePath = path.join(resourcesDir, resourceFilename)

              $(el).attr(attr, `${resourcesDirName}/${resourceFilename}`)

              return axios.get(resourceUrl, { responseType: 'arraybuffer' })
                .then(res => fs.writeFile(resourcePath, res.data))
                .catch((error) => {
                  console.warn(`Failed to download resource: ${resourceUrl}`, error.message)
                  return null
                })
            }).get().filter(Boolean),
          )

          return fs.mkdir(resourcesDir, { recursive: true })
            .then(() => Promise.all(resourcePromises))
            .then(() => fs.writeFile(filepath, $.html()))
            .then(() => filepath)
        })
    })
    .catch((error) => {
      if (error.code === 'EACCES' || error.code === 'EPERM') {
        throw new Error(`Permission denied: ${outputDir}`)
      }
      if (error.code === 'ENOENT') {
        throw new Error(`Directory does not exist: ${outputDir}`)
      }
      if (error.code === 'ENOTDIR') {
        throw new Error(`Not a directory: ${outputDir}`)
      }
      throw error
    })
}

export default pageLoader
