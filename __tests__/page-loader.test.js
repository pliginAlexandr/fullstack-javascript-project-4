import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import nock from 'nock'
import * as cheerio from 'cheerio'
import pageLoader from '../src/page-loader.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)

let tempDir

beforeAll(() => {
  nock.disableNetConnect()
})

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
})

afterEach(() => {
  nock.cleanAll()
})

test('pageLoader downloads page and pictures', async () => {
  const url = 'https://ru.hexlet.io/courses'

  const htmlBefore = await fs.readFile(getFixturePath('before.html'), 'utf-8')
  const htmlAfter = await fs.readFile(getFixturePath('after.html'), 'utf-8')
  const imageFixture = await fs.readFile(getFixturePath('nodejs.png'))

  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, htmlBefore)

  nock('https://ru.hexlet.io')
    .get('/assets/professions/nodejs.png')
    .reply(200, imageFixture)

  const filepath = await pageLoader(url, tempDir)

  const savedHtml = await fs.readFile(filepath, 'utf-8')

  const $expected = cheerio.load(htmlAfter)
  const $received = cheerio.load(savedHtml)

  expect($received('title').text()).toBe($expected('title').text())
  expect($received('img').attr('src')).toBe($expected('img').attr('src'))
  expect($received('img').attr('alt')).toBe($expected('img').attr('alt'))

  const resourcesDir = path.join(tempDir, 'ru-hexlet-io-courses_files')
  const savedImagePath = path.join(resourcesDir, 'ru-hexlet-io-assets-professions-nodejs.png')
  const savedImage = await fs.readFile(savedImagePath)

  expect(savedImage).toEqual(imageFixture)
})
