import axios from 'axios'
import { promises as fs } from 'fs'
import Listr from 'listr'
import path from 'path'

const downloadResources = (resources, resourcesDirName) => {
  const tasks = new Listr(
    resources.map(({ resourceUrl, resourcePath, el, attr, resourceFilename }) => ({
      title: `Downloading: ${resourceUrl}`,
      task: () =>
        axios
          .get(resourceUrl, { responseType: 'arraybuffer' })
          .then((res) => {
            if (res.status !== 200) {
              throw new Error(`Unexpected status code ${res.status} for ${resourceUrl}`)
            }
            return fs.writeFile(resourcePath, res.data)
          })
          .then(() => {
            el.attribs[attr] = path.join(resourcesDirName, resourceFilename)
          })
          .catch((err) => {
            throw new Error(`Failed to download resource ${resourceUrl}: ${err.message}`)
          }),
    })),
    { concurrent: true },
  )

  return tasks.run()
}

export default downloadResources
