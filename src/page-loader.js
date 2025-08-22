import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { makeFilename, makeDirName, makeResourceName } from './utils.js'

const pageLoader = (url, outputDir = process.cwd()) => {
  const pageFilename = makeFilename(url)
  const filepath = path.join(outputDir, pageFilename)
  const resourcesDir = path.join(outputDir, makeDirName(url))

  return axios.get(url)
    .then((response) => {
      const $ = cheerio.load(response.data)

      const imgPromises = $('img').map((i, el) => {
        const src = $(el).attr('src')
        if (!src) return null

        const resourceUrl = new URL(src, url).toString()

        const resourceFilename = makeResourceName(resourceUrl)

        const resourcePath = path.join(resourcesDir, resourceFilename)

        $(el).attr('src', `${makeDirName(url)}/${resourceFilename}`)

        return axios.get(resourceUrl, { responseType: 'arraybuffer' })
          .then(res => fs.writeFile(resourcePath, res.data))
      }).get()

      return fs.mkdir(resourcesDir, { recursive: true })
        .then(() => Promise.all(imgPromises))
        .then(() => fs.writeFile(filepath, $.html()))
        .then(() => filepath)
    })
}

export default pageLoader
