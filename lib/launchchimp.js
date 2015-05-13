(function() {
  'use strict';

  var bunyan     = require('bunyan');
  var launchrock = require('./client/launchrock');
  var mailchimp  = require('./client/mailchimp');
  var lrCsv      = require('./csv');

  var LOGGER = bunyan.createLogger({name: 'Launchchimp'});
  var poller;

  var worker = function (opts) {
    if (process.getgid() === 0) {
      process.setgid('nobody');
      process.setuid('nobody');
    }

    launchrock
      .fetchUsers(opts.launchrock)
      .then(lrCsv.parseUserCSV)
      .then(function (users) {
        return mailchimp.addUsersToList(opts.mailchimp, users);
      })
      .then(function (result) {
        if (opts.mailchimp.admins) {
          return mailchimp.notifyAdmin(opts.mailchimp.admins, result);
        }
        return result;
      })
      .catch(function (err) {
        LOGGER.error(err);
      });
  };

  var exports = {
    poll: function (options) {
      var frequency = options.freq;

      LOGGER.info('STARTING POLLER WITH INTERVAL: ' + (frequency / 1000) + 's');

      // Call immediately
      worker(options);

      // Defer future calls
      poller = poller || setInterval(function () {
        worker(options);
      }, frequency);
    }
  };

  module.exports = exports;

  process.on('SIGTERM', function () {
    if (poller === undefined) return;

    LOGGER.info('STOPPING POLLER!');

    clearInterval(poller);

    // Disconnect from cluster master
    process.disconnect && process.disconnect();
  });

  if (require.main === module) {
    var options = {
      freq: process.env.LAUNCHCHIMP_POLL_FREQUENCY || 600000,
      launchrock: {
        email: process.env.LAUNCHCHIMP_LR_EMAIL,
        password: process.env.LAUNCHCHIMP_LR_PASSWORD,
        project: process.env.LAUNCHCHIMP_LR_PROJECT
      },
      mailchimp: {
        apiKey: process.env.LAUNCHCHIMP_MC_API_KEY,
        listName: process.env.LAUNCHCHIMP_MC_LIST,
        admins: process.env.LAUNCHCHIMP_MC_ADMINS
      }
    };

    exports.poll(options);
  }
})();
