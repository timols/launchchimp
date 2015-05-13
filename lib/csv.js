(function() {
  'use strict';

  var csv = require('fast-csv');
  var Q = require('q');

  var parseUserCSV = function (str) {
    var users = [];
    var deferred = Q.defer();

    csv
      .fromString(str, {headers: true})
      .on('data', function (data) {
        users.push(data);
      })
      .on('end', function (cnt) {
        if (cnt === users.length) {
          deferred.resolve(users);
        } else {
          deferred.reject(new Error('Failed to parse users'));
        }
      });

    return deferred.promise;
  };

  module.exports = {
    parseUserCSV: parseUserCSV
  };

})();
