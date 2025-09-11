import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import nock from 'nock'
import axios from 'axios'
import * as cheerio from 'cheerio'
import pageLoader from '../src/page-loader.js'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'
import debug from 'debug'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const getFixturePath = filename => path.join(__dirname, '..', '__fixtures__', filename)

let tempDir

const log = debug('page-loader:test')

beforeAll(() => {
  nock.disableNetConnect()
})

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  log(`Created temp directory: ${tempDir}`)
})

afterEach(() => {
  nock.abortPendingRequests()
  nock.cleanAll()
  log('Cleaned all nock interceptors and aborted pending requests')
})

afterAll(() => {
  nock.restore()
})

test('pageLoader downloads page and pictures', async () => {
  const url = 'https://ru.hexlet.io/courses'

  const htmlBefore = await fs.readFile(getFixturePath('before.html'), 'utf-8')
  const htmlAfter = await fs.readFile(getFixturePath('after.html'), 'utf-8')
  const imageFixture = await fs.readFile(getFixturePath('nodejs.png'))
  const cssFixture = '/* fake css content */'
  const jsFixture = '// fake js content'

  const scope = nock('https://ru.hexlet.io').persist()

  scope.get('/courses').reply(200, htmlBefore)
  scope.get('/assets/professions/nodejs.png').reply(200, imageFixture)
  scope.get('/assets/application.css').reply(200, cssFixture)
  scope.get('/packs/js/runtime.js').reply(200, jsFixture)

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

  nock('https://example.com').get('/page').reply(200, htmlBefore)
  nock('https://example.com').get('/images/picture.png').reply(200, imageFixture)

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

test('pageLoader works with default outputDir (process.cwd())', async () => {
  const originalCwd = process.cwd
  process.cwd = jest.fn(() => tempDir)

  try {
    const url = 'https://example.com/page'
    const htmlBefore = '<html><head></head><body><h1>Hello</h1></body></html>'

    nock('https://example.com').get('/page').reply(200, htmlBefore)

    const filepath = await pageLoader(url)
    const savedHtml = await fs.readFile(filepath, 'utf-8')

    expect(savedHtml).toContain('<h1>Hello</h1>')
  }
  finally {
    process.cwd = originalCwd
  }
})

test('pageLoader fails on network error', async () => {
  const url = 'https://example.com/page'

  nock('https://example.com').get('/page').delay(2000).reply(200, 'ok')

  const originalGet = axios.get
  try {
    axios.get = (url, config = {}) => {
      return originalGet(url, { timeout: 500, ...config })
    }

    await expect(pageLoader(url, tempDir))
      .rejects.toThrow(/Network error while loading/)
  }
  finally {
    axios.get = originalGet
  }
})

test('pageLoader fails on HTTP error (404)', async () => {
  const url = 'https://example.com/missing'
  nock('https://example.com').get('/missing').reply(404)

  await expect(pageLoader(url, tempDir))
    .rejects.toThrow(/HTTP status: 404/)
})

test('pageLoader fails when output directory is not writable', async () => {
  const url = 'https://example.com/page'
  const html = '<html><body><h1>Hi</h1></body></html>'

  nock('https://example.com').get('/page').reply(200, html)

  const lockedDir = path.join(tempDir, 'locked')
  await fs.mkdir(lockedDir, { recursive: true })
  await fs.chmod(lockedDir, 0o444)

  await expect(pageLoader(url, lockedDir))
    .rejects.toThrow(/Directory not writable/)

  await fs.chmod(lockedDir, 0o755)
})
