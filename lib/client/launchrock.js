(function() {
  'use strict';

  var request = require('request-promise');
  var bunyan = require('bunyan');
  var defaults = require('./defaults');

  var LOGGER     = bunyan.createLogger({name: 'Launchchimp.Launchrock'});
  var AUTH_URL   = 'https://www.launchrock.com/auth/login';
  var BASE_URL   = 'http://platform.launchrock.com/v1';
  var EXPORT_URL = 'http://export.launchrock.com/export';

  var authenticate = function (email, password) {
    LOGGER.info('LOGGING IN');

    return request
      .post(AUTH_URL, {
        form: {
          email: email,
          password: password
        },
        headers: defaults.headers,
        resolveWithFullResponse: true,
        simple: false
      }).then(function (response) {
        var hash;
        if (response.statusCode === 302) {
          hash = response.headers.location.split('#')[1];
          LOGGER.info('LOGGED IN. RECEIVED HASH: ' + hash);
        }

        if (hash) {
          return request
            .post(BASE_URL + '/platformUserLoginByAdminHash', {
              form: { hash: hash },
              headers: defaults.headers
            });
        } else {
          throw new Error('Failed to login with email and password');
        }
      }).then(function (body) {
        var json = JSON.parse(body),
            result = json && json[0].response,
            user = result && result.status === 'OK' && result.platform_user;

        if (!user) {
          throw new Error('Failed to obtain platform user: ' + result.error.error_message);
        }

        LOGGER.info('OBTAINED PLATFORM USER: ' + user.UID);
        return user;
      });
  };

  var fetchProject = function (user, projectName) {
    return request
      .post(BASE_URL + '/getPlatformUserSites', {
        form: {user_id: user.UID},
        headers: defaults.headers
      }).then(function (body) {
        var json = JSON.parse(body),
            result = json && json[0].response,
            sites = result && result.status === 'OK' && result.platform_user_sites,
            sid;

        if (sites) {
          sid = sites.filter(function (site) {
            return site.siteName === projectName;
          }).map(function (site) {
            return site.SID;
          })[0];
        }

        if (!sid) {
          throw new Error('Failed to locate a project with name: ' + projectName);
        }

        LOGGER.info('IDENTIFIED PROJECT: ' + sid);

        return {
          uid: user.UID,
          sessionId: user.session_id,
          sid: sid
        };
      });
  };

  var fetchUsers = function (params) {
    LOGGER.info('REQUESTING ACCESS TOKEN');

    return request
      .post(BASE_URL + '/getSiteApiToken', {
        form: {
          site_id: params.sid,
          session_id: params.sessionId,
          user_id: params.uid
        },
        headers: defaults.headers
      }).then(function (body) {
        var json = JSON.parse(body),
            result = json && json[0].response,
            token = result && result.status === 'OK' &&
                    result.api_info && result.api_info.access_token;

        if (!token) {
          throw new Error('Failed to obtain token: ' + result.error.error_message);
        }

        params.token = token;
        return params;
      }).then(function (params) {
        LOGGER.info('EXPORTING CSV');

        return request.get(EXPORT_URL, {
          qs: {
            site_id: params.sid,
            user_id: params.uid,
            access_token: params.token
          },
          headers: defaults.headers
        });
      });
  };

  module.exports = {
    fetchUsers: function (lrOpts) {
      return authenticate(lrOpts.email, lrOpts.password)
        .then(function (user) {
          return fetchProject(user, lrOpts.project);
        })
        .then(fetchUsers);
    }
  };

})();
