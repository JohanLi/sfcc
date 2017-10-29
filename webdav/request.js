require('dotenv').config();

const request = require('request-promise');
const fs = require('fs-extra');
const path = require('path');

const defaults = {
  baseUrl: `https://${process.env.SFCC_DOMAIN}/on/demandware.servlet/webdav/Sites/Cartridges/`,
  auth: {
    user: process.env.SFCC_USERNAME,
    password: process.env.SFCC_PASSWORD,
  },
  strictSSL: false,
};

if (process.env.SFCC_CERTIFICATE) {
  defaults.pfx = fs.readFileSync(path.join(process.cwd(), process.env.SFCC_CERTIFICATE));
  defaults.passphrase = process.env.SFCC_CERTIFICATE_PASSPHRASE;
}

module.exports = request.defaults(defaults);
