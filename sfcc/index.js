const xml2js = require('xml2js');
const decompress = require('decompress');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const rimraf = require('rimraf');
const babel = require('babel-core');
const glob = require('glob');
const sass = require('node-sass');
const zip = require('./zip');
const log = require('./log');

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

const toCodeVersion = (path, codeVersion) => path.replace(/^cartridges/, codeVersion);

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
      const isDirectory = Object.prototype.hasOwnProperty.call(prop.resourcetype[0], 'collection');
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
    chokidar
      .watch('./cartridges', { ignoreInitial: true })
      .on('all', async (event, path) => {
        try {
          if (path.substr(-9) === 'jb_tmp___') {
            return;
          }

          if (event === 'add' || event === 'change') {
            if (path.substr(-5) === '.scss') {
              await sfcc.compileSass();
            } else if (path.substr(-3) === '.js') {
              await sfcc.transpileAndUploadJs(codeVersion, path);
            } else {
              await sfcc.upload(codeVersion, path);
            }
          }

          if (event === 'unlink' || event === 'unlinkDir') {
            await webdav.remove(toCodeVersion(path, codeVersion));
            log.timestamp(`Removed ${path} from ${codeVersion}`);
          }

          if (event === 'addDir') {
            await webdav.addDir(toCodeVersion(path, codeVersion));
            log.timestamp(`Uploaded ${path} to ${codeVersion}`);
          }
        } catch (error) {
          sfcc.handleError(error, path);
        }
      });
  },

  compileSass: async () => {
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

    log.timestamp('Compiled all .scss files');
  },

  transpileAndUploadJs: async (codeVersion, path) => {
    const { code } = babel.transformFileSync(path, {
      presets: ['env'],
    });

    await webdav.upload(
      toCodeVersion(path, codeVersion),
      code,
    );

    log.timestamp(`Transpiled and uploaded ${path} to ${codeVersion}`);
  },

  upload: async (codeVersion, path) => {
    let content = fs.readFileSync(path);

    if (content.byteLength === 0) {
      content = '';
    }

    await webdav.upload(
      toCodeVersion(path, codeVersion),
      content,
    );

    log.timestamp(`Uploaded ${path} to ${codeVersion}`);
  },

  deploy: async (codeVersion) => {
    await zip(codeVersion);

    await webdav.upload('./deploy.zip', fs.readFileSync('./deploy.zip'));
    await webdav.unzip('./deploy.zip');
    await webdav.remove('./deploy.zip');
    fs.removeSync('./deploy.zip');
  },

  handleError: (error, path) => {
    if (error.statusCode === 401) {
      log.error('Authentication failed, please check your .env file');
      process.exit();
    } else if (error.statusCode === 404) {
      if (error.options.method === 'DELETE') {
        log.error(`Attempting to delete ${path} failed, as it doesn't seem available on the server`);
      }
    } else {
      log.error(error.message);
    }
  },
};

module.exports = sfcc;
