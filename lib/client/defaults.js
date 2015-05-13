(function() {
  'use strict';

  var version = require('../../package.json').version;
  var userAgent = 'Launchchimp ' + version;

  module.exports = {
    headers: { 'User-Agent': userAgent }
  };

})();
