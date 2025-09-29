import axios from 'axios'
import { promises as fs } from 'fs'
import Listr from 'listr'
import path from 'path'

const downloadResources = (resources, resourcesDirName, { strict = true, log = console } = {}) => {
  const tasks = new Listr(
    resources.map(({ resourceUrl, resourcePath }) => ({
      title: `Downloading: ${resourceUrl}`,
      task: () =>
        axios.get(resourceUrl, { responseType: 'arraybuffer' })
          .then((res) => {
            if (res.status !== 200) {
              throw new Error(`Unexpected status code ${res.status} for ${resourceUrl}`)
            }
            return fs.writeFile(resourcePath, res.data)
          })
          .catch((err) => {
            if (strict) {
              throw new Error(`Failed to download resource ${resourceUrl}: ${err.message}`)
            }
            else {
              log.warn(`Failed to download resource ${resourceUrl}: ${err.message}`)
            }
          }),
    })),
    { concurrent: true },
  )

  return tasks.run()
    .then(() => {
      resources.forEach(({ el, attr, resourceFilename }) => {
        el.attribs[attr] = path.join(resourcesDirName, resourceFilename)
      })
    })
}

export default downloadResources
