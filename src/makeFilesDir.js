import fs from 'fs/promises';
import path from 'path';
import nameGenerator from './nameGenerator.js';

const makeFilesDir = (url, baseDir = process.cwd()) => {
  const dirName = nameGenerator(url).concat('_files');
  const dirPath = path.join(baseDir, dirName);

  return fs.mkdir(dirPath)
    .then(() => dirPath)
    .catch((error) => {
      console.error(`Error creating directory ${dirPath}:`, error);
      throw error;
    });
};

export default makeFilesDir;
