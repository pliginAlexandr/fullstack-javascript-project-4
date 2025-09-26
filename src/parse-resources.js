import * as path from 'path'
import * as cheerio from 'cheerio'
import { makeResourceName, isResource } from './utils.js'

const isLocal = (resourceUrl, baseUrl) => {
  const pageHost = new URL(baseUrl).hostname
  const resHost = new URL(resourceUrl, baseUrl).hostname
  return pageHost === resHost
}

const parseResources = (html, url, resourcesDirName, resourcesDir, log) => {
  const $ = cheerio.load(html)
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

  return { $, resources }
}

export default parseResources
