import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import nameGenerator from './nameGenerator.js';
import makeFilesDir from './makeFilesDir.js';

const loadPage = (url, outputDir) => {
  const fileName = nameGenerator(url).concat('.html');
  const filePath = path.join(outputDir, fileName);

  return axios.get(url)
    .then((response) => fs.writeFile(filePath, response.data))
    .then(() => makeFilesDir(url, outputDir))
    .then(() => filePath);
};

export default loadPage;
