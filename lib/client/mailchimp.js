(function() {
  'use strict';

  var request  = require('request-promise');
  var bunyan   = require('bunyan');
  var defaults = require('./defaults');
  var mailer   = require('nodemailer');

  var LOGGER   = bunyan.createLogger({name: 'Launchchimp.Mailchimp'});
  var BASE_URL = 'https://<DC>.api.mailchimp.com/2.0/';

  var addUsersToList = function (apiKey, listName, users) {
    LOGGER.info('USERS RECEIVED. FETCHING MAILCHIMP LIST.');

    var datacenter = apiKey.split('-')[1];
    var base = BASE_URL.replace('<DC>', datacenter);

    return request.post(base + 'lists/list', {
      form: {
        apikey : apiKey,
        filters: {
          list_name: listName,
          exact    : true
        }
      },
      headers: defaults.headers
    }).then(function (body) {
      var json = JSON.parse(body);
      var listId = json.data && json.data[0] && json.data[0].id;

      if (!listId) {
        throw new Error('Failed to obtain list id for ' + listName);
      }

      LOGGER.info('IDENTIFED MAILCHIMP LIST: ' + listId + '. SUBSCRIBING USERS.');

      return request
        .post(base + 'lists/batch-subscribe', {
          form    : {
            apikey: apiKey,
            id    : listId,
            batch : users.map(function (user) {
              return {
                email: {email: user.lr_email},
                email_type: 'html',
                merge_vars: {
                  FNAME  : user.extra_fields_first_name,
                  LNAME  : user.extra_fields_last_name,
                  COMPANY: user.extra_fields_company,
                  PH     : user.extra_fields_phone_number
                }
              };
            }),
            double_optin   : false,
            update_existing: true
          },
          headers: defaults.headers
        });
      }).then(function (resp) {
        var data = JSON.parse(resp);
        LOGGER.info('ADDED: ' + data.add_count + ' UPDATED: ' + data.update_count + ' ERRORS: ' + data.error_count)
        return {
          list: listName,
          data: data,
          users: users
        };
      });
  };

  var notifyAdmin = function (admins, mcResults) {
    var numAdded = mcResults.data.add_count;
    if (numAdded > 0) {
      LOGGER.info('NOTIFYING ADMINS: ' + admins);
      var transporter = mailer.createTransport();

      var subject = 'Launchchimp added ' + numAdded +
                    ' Launchrock users to the \'' + mcResults.list + '\' Mailchimp list';

      var text = [
        'Hi,',
        'Launchchimp successfully ran and added ' + numAdded + ' users.',
        '',
        'The following users were added: ',
        ''
      ];

      var userIdx = mcResults.users.reduce(function (acc, user) {
        acc[user.lr_email] = user;
        return acc;
      }, {});

      mcResults.data.adds.forEach(function (added) {
        var user = userIdx[added.email];

        if (user) {
          text.push(user.extra_fields_first_name + ' ' + user.extra_fields_last_name + ' (' + added.email + ')');
        }
      });

      transporter.sendMail({
          from: 'Launchchimp <hi@launchchimp.com>',
          to: admins,
          subject: subject,
          text: text.join('\n')
      });
    } else {
      LOGGER.info('SKIPPING NOTIFICATIONS. NO NEW USERS ADDED.');
    }
  };

  module.exports = {
    addUsersToList: function (mcOpts, users) {
      return addUsersToList(mcOpts.apiKey, mcOpts.listName, users);
    },

    notifyAdmin: notifyAdmin
  };

})();
