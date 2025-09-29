import axios from 'axios'
import { promises as fs } from 'fs'
import Listr from 'listr'
import path from 'path'

const downloadResources = async (resources, resourcesDirName, { strict = true, log = console } = {}) => {
  const tasks = new Listr(
    resources.map(({ resourceUrl, resourcePath }) => ({
      title: `Downloading: ${resourceUrl}`,
      task: async () => {
        try {
          const res = await axios.get(resourceUrl, { responseType: 'arraybuffer' })
          if (res.status !== 200) {
            throw new Error(`Unexpected status code ${res.status} for ${resourceUrl}`)
          }
          await fs.writeFile(resourcePath, res.data)
        } catch (err) {
          if (strict) {
            throw new Error(`Failed to download resource ${resourceUrl}: ${err.message}`)
          } else {
            log.warn(`Failed to download resource ${resourceUrl}: ${err.message}`)
          }
        }
      },
    })),
    { concurrent: true }
  )

  await tasks.run()

  resources.forEach(({ el, attr, resourceFilename }) => {
    el.attribs[attr] = path.join(resourcesDirName, resourceFilename)
  })
}

export default downloadResources
