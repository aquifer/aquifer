/**
 * @file
 * Refreshes the site against the current state of its codebase.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Refreshes the site against the current state of its codebase.
   *
   * @param {string} target Either a site alias for running the command remotely or a directory for running it locally.
   * @param {array} commands An array of drush commands which are each an array of arguments. e.g. ['cc', 'drush'].
   * @param {funciton} callback called when process finishes executing or errors out.
   */
  var refresh = function (target, commands, callback) {
    // If project isn't initialized (doesn't exist) then exit.
    if (!Aquifer.initialized) {
      callback('Cannot build a project that hasn\'t been initialized.');
      return;
    }

    var drush     = require('drush-node'),
        promise   = require('promised-io/promise'),
        location  = target.indexOf('@') === 0 ? [target] : ['-r', target],
        functions = [drush.init];

    commands.forEach(function (args) {
      functions.push(function() {
        return drush.spawn(location.concat(args));
      });
    });

    promise.seq(functions)
      .then(function () {
        callback();
      },
      function (err) {
        callback(err);
      });
  };

  return refresh;
};
