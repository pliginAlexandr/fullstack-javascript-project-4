import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/pageLoader.js';
import makeFilesDir from '../src/makeFilesDir.js';

let tmpDir;

const testUrl = 'https://ru.hexlet.io/courses';
const html = '<html><body>Hello World</body></html>';

beforeAll(() => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, html);
});

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('page is downloaded and saved', async () => {
  const filePath = await pageLoader(testUrl, tmpDir);
  const data = await fs.readFile(filePath, 'utf-8');

  expect(data).toBe(html);
});

test('makeFilesDir creates directory correctly', async () => {
  const url = 'https://example.com/some-page';
  const expectedDirName = 'example-com-some-page_files';
  const expectedDirPath = path.join(tmpDir, expectedDirName);
  const dirPath = await makeFilesDir(url, tmpDir);

  expect(dirPath).toBe(expectedDirPath);

  const dirExists = await fs.access(expectedDirPath).then(() => true).catch(() => false);
  expect(dirExists).toBe(true);
});
