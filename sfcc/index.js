const xml2js = require('xml2js');
const decompress = require('decompress');
const fs = require('fs');
const rimraf = require('rimraf');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');

const { promisify } = require('util');

const webdav = require('../webdav/');
require('dotenv').config();

const parseXmlAsync = promisify(xml2js.parseString);
const rimrafAsync = promisify(rimraf);

const latestFirst = (a, b) => {
  const aTimestamp = new Date(a.propstat[0].prop[0].getlastmodified[0])
    .getTime();

  const bTimestamp = new Date(b.propstat[0].prop[0].getlastmodified[0])
    .getTime();

  return bTimestamp - aTimestamp;
};

const leadingZero = input => (`0${input}`).slice(-2);

const sfcc = {
  checkEnv: () => {
    if (!(process.env.SFCC_DOMAIN || process.env.SFCC_USERNAME || process.env.SFCC_PASSWORD)) {
      throw new Error('You need to set up your environment variables to contain SFCC_DOMAIN, SFCC_USERNAME and SFCC_PASSWORD');
    }
  },

  codeVersions: async () => {
    let propfind = await webdav.propfind('/');

    propfind = await parseXmlAsync(propfind);

    propfind = propfind.multistatus.response.filter((response) => {
      const prop = response.propstat[0].prop[0];
      const isDirectory = prop.resourcetype[0].hasOwnProperty('collection');
      const notRoot = prop.displayname[0] !== '';

      return isDirectory && notRoot;
    });

    return propfind
      .sort(latestFirst)
      .map(response => response.propstat[0].prop[0].displayname[0]);
  },

  import: async (codeVersion) => {
    await webdav.zip(codeVersion);
    const file = await webdav.download(`${codeVersion}.zip`);

    fs.writeFileSync(`${codeVersion}.zip`, file);
    await rimrafAsync('./cartridges');
    await decompress(`${codeVersion}.zip`, 'cartridges', { strip: 1 });

    await webdav.remove(`${codeVersion}.zip`);
    fs.unlinkSync(`${codeVersion}.zip`);
  },

  watch: (codeVersion) => {
    fs.watch('./cartridges', { recursive: true }, async (eventType, filename) => {
      if (filename.substr(-3) === '.js') {
        const { code } = babel.transformFileSync(`./cartridges/${filename}`, {
          presets: [es2015],
        });

        await webdav.upload(
          `./${codeVersion}/${filename}`,
          code,
        );

        const now = new Date();
        const timestamp = `${leadingZero(now.getHours())}:${leadingZero(now.getMinutes())}:${leadingZero(now.getSeconds())}`;

        console.log(`Uploaded /cartridges/${filename} into ${codeVersion} (at ${timestamp})`);
      }
    });
  },
};

module.exports = sfcc;
