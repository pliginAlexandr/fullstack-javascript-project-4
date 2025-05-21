import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';

function nameGenerator(url) {
  const { hostname, pathname } = new URL(url);
  const fullPath = `${hostname}${pathname}`;
  const result = fullPath
    .replace(/\/$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .concat('.html');
  return result;
}

const loadPage = (url, outputDir) => axios.get(url)
  .then((response) => {
    const fileName = nameGenerator(url);
    const filePath = path.join(outputDir, fileName);
    return fsp.writeFile(filePath, response.data)
      .then(() => filePath);
  });

export default loadPage;
