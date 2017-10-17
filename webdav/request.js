require('dotenv').config();

const request = require('request-promise');

module.exports = request.defaults({
  baseUrl: `https://${process.env.SFCC_DOMAIN}/on/demandware.servlet/webdav/Sites/Cartridges/`,
  auth: {
    user: process.env.SFCC_USERNAME,
    password: process.env.SFCC_PASSWORD,
  },
  strictSSL: false,
});
