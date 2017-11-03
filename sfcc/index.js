const xml2js = require('xml2js');
const decompress = require('decompress');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');
const glob = require('glob');
const sass = require('node-sass');
const zip = require('./zip');

const { promisify } = require('util');

const webdav = require('../webdav/');
require('dotenv').config();

const parseXmlAsync = promisify(xml2js.parseString);
const rimrafAsync = promisify(rimraf);
const globAsync = promisify(glob);

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
    fs.removeSync(`${codeVersion}.zip`);
  },

  watch: (codeVersion) => {
    fs.watch('./cartridges', { recursive: true }, async (eventType, filename) => {
      sfcc.uploadJs(codeVersion, filename);
      sfcc.compileSass(filename);
      sfcc.uploadCss(codeVersion, filename);
    });
  },

  uploadJs: async (codeVersion, filename) => {
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
  },

  compileSass: async (filename) => {
    if (filename.substr(-5) === '.scss') {
      const files = await globAsync('./cartridges/**/!(_)*.scss');

      files.forEach((sassFilepath) => {
        const result = sass.renderSync({
          file: sassFilepath,
        });

        const cssFilepath = sassFilepath
          .replace(/\/cartridge\/scss\/([^/]+)\//, '/cartridge/static/$1/css/')
          .replace(/.scss$/, '.css');

        fs.outputFileSync(cssFilepath, result.css);
      });
    }
  },

  uploadCss: async (codeVersion, filename) => {
    if (filename.substr(-4) === '.css') {
      console.log(`./${codeVersion}/${filename}`);
      await webdav.upload(
        `./${codeVersion}/${filename}`,
        fs.readFileSync(`./cartridges/${filename}`),
      );

      const now = new Date();
      const timestamp = `${leadingZero(now.getHours())}:${leadingZero(now.getMinutes())}:${leadingZero(now.getSeconds())}`;

      console.log(`Uploaded /cartridges/${filename} into ${codeVersion} (at ${timestamp})`);
    }
  },

  deploy: async (codeVersion) => {
    await zip(codeVersion);

    await webdav.upload('./deploy.zip', fs.readFileSync('./deploy.zip'));
    await webdav.unzip('./deploy.zip');
    await webdav.remove('./deploy.zip');
    fs.removeSync('./deploy.zip');
  },
};

module.exports = sfcc;
