const request = require('./request');

const webdav = {
  upload: async (filePath, file) => request({
    uri: filePath,
    method: 'PUT',
    form: {
      data: file,
    },
  }),

  download: async filePath => request({
    uri: filePath,
    method: 'GET',
    encoding: null,
  }),

  zip: async filePath => request({
    uri: filePath,
    method: 'POST',
    form: {
      method: 'ZIP',
    },
  }),

  unzip: async filePath => request({
    uri: filePath,
    method: 'POST',
    form: {
      method: 'UNZIP',
    },
  }),

  remove: async filePath => request({
    uri: filePath,
    method: 'DELETE',
  }),

  propfind: async filePath => request({
    uri: filePath,
    method: 'PROPFIND',
  }),
};

module.exports = webdav;
