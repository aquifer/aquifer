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
   * @param {function} callback called when process finishes executing or errors out.
   *
   * @returns {boolean} false if aquifer isn't initialized, true if refresh completes.
   */
  var refresh = function (target, callback) {
    // If project isn't initialized (doesn't exist) then exit.
    if (!Aquifer.initialized) {
      callback('Cannot build a project that hasn\'t been initialized.');
      return false;
    }

    var drush     = require('drush-node'),
        promise   = require('promised-io/promise'),
        location  = target.indexOf('@') === 0 ? [target] : ['-r', target],
        functions = [drush.init];

    Aquifer.project.config.refreshCommands.forEach(function (args) {
      functions.push(function () {
        return drush.exec(location.concat(args), {log: true});
      });
    });

    promise.seq(functions)
      .then(function () {
        callback();
      }, function (err) {
        callback(err);
      });

    return true;
  };

  return refresh;
};
