import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import { makeFilename } from './utils.js'

const pageLoader = (url, outputDir = process.cwd()) => {
  const filepath = path.join(outputDir, makeFilename(url))

  return axios.get(url)
    .then(response => fs.writeFile(filepath, response.data))
    .then(() => filepath)
}

export default pageLoader
