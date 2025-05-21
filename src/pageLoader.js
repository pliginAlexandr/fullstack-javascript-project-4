import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import nameGenerator from './nameGenerator.js';

const loadPage = (url, outputDir) => axios.get(url)
  .then((response) => {
    const fileName = nameGenerator(url);
    const filePath = path.join(outputDir, fileName);
    return fsp.writeFile(filePath, response.data)
      .then(() => filePath);
  });

export default loadPage;
