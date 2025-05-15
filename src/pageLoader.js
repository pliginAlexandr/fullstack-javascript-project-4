import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';

export default function nameGenerator(url) {
  const { hostname, pathname } = new URL(url);
  const fullPath = `${hostname}${pathname}`;
  const result = fullPath
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${result}.html`;
}


const loadPage = (url, outputDir) => {
  return axios.get(url)
    .then((response) => {
      const fileName = nameGenerator(url);
      const filePath = path.join(outputDir, fileName);
      return fsp.writeFile(filePath, response.data)
        .then(() => filepath);
    })
}



