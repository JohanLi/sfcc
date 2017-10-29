const fs = require('fs-extra');
const archiver = require('archiver');

const zip = codeVersion => new Promise((resolve, reject) => {
  const output = fs.createWriteStream('./deploy.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    resolve(`Created zip file (${archive.pointer()} bytes)`);
  });

  archive.on('warning', (error) => {
    reject(error);
  });

  archive.on('error', (error) => {
    reject(error);
  });

  archive.pipe(output);
  archive.directory('./cartridges', codeVersion);
  archive.finalize();
});

module.exports = zip;
