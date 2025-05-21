import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/pageLoader.js';

const testUrl = 'https://ru.hexlet.io/courses';
const html = '<html><body>Hello World</body></html>';

beforeAll(() => {
  nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, html);
});

test('page is downloaded and saved', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  const filePath = await pageLoader(testUrl, tmpDir);
  const data = await fs.readFile(filePath, 'utf-8');

  expect(data).toBe(html);
});
