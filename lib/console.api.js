/**
 * @file
 * Defines console tools for aquifer.
 */

/* globals require, module, console */

module.exports = function(Aquifer) {
  'use strict';

  var chalk = require('chalk'),
      Console = {
        /**
         * Defines a logging method for aquifer cli commands.
         *
         * @param {string} message message that should be logged to the console.
         * @param {string} type type of message that should be logged. [notice, error, success].
         * @param {boolean} suppress indicates whether or not messaged should be output.
         *                         This exists so that parent functions can turn suppression on
         *                         without having to wrap everything in conditionals.
         *
         * @returns {string} message that was sent.
         */
        log: function(message, type, suppress) {
          var entry       = false,
              typeColors  = {
                status: chalk.dim,
                notice: chalk.blue,
                warning: chalk.yellow.bold,
                error: chalk.white.bgRed.bold,
                success: chalk.green
              };

          // If suppress is turned on, do nothing.
          if (suppress) {
            return;
          }

          if (typeColors.hasOwnProperty(type)) {
            entry = typeColors[type](message);
          }
          else {
            entry = message + ' (NOTE: "' + type + '" is not a proper log type. Please use "notice", "warning", "error", or "success")';
          }
          console.log(entry);
          return entry;
        }
      };

  return Console;
};
