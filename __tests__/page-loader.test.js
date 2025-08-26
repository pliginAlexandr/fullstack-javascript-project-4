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

test('pageLoader ignores <img> without src and downloads only valid images', async () => {
  const url = 'https://example.com/page'

  const htmlBefore = `
    <!DOCTYPE html>
    <html>
      <body>
        <img src="/images/picture.png" alt="valid"/>
        <img alt="broken-without-src"/>
      </body>
    </html>
  `

  const imageFixture = Buffer.from('fake image content')

  nock('https://example.com')
    .get('/page')
    .reply(200, htmlBefore)

  nock('https://example.com')
    .get('/images/picture.png')
    .reply(200, imageFixture)

  const savedHtmlPath = await pageLoader(url, tempDir)
  const savedHtml = await fs.readFile(savedHtmlPath, 'utf-8')

  const $ = cheerio.load(savedHtml)

  expect($('img').length).toBe(2)
  expect($('img').first().attr('src'))
    .toBe('example-com-page_files/example-com-images-picture.png')
  expect($('img').first().attr('alt')).toBe('valid')
  expect($('img').last().attr('src')).toBeUndefined()

  const resourcesDir = path.join(tempDir, 'example-com-page_files')
  const savedImagePath = path.join(resourcesDir, 'example-com-images-picture.png')
  const savedImage = await fs.readFile(savedImagePath)

  expect(savedImage).toEqual(imageFixture)
})
