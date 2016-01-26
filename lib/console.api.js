/**
 * @file
 * Defines console tools for Aquifer.
 */

'use strict';

// Load dependencies.
const chalk = require('chalk');

/**
 * Constructs console tools for Aquifer.
 *
 * @class
 * @classdesc Contains console tools for Aquifer.
 */
class Console {

  /**
   * Defines a logging method for aquifer cli commands.
   *
   * @param {string} message message that should be logged to the console.
   * @param {string|undefined} type type of message that should be logged. [notice, error, success].
   * @param {number} errorCode error code with which this log should exit.
   * @param {boolean} suppress indicates whether or not messaged should be output.
   * @returns {object} promise object.
   */
  log(message, type, errorCode, suppress) {
    return new Promise((resolve, reject) => {
      let entry = false;
      let typeColors = {
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

      // Default type and error code.
      type = type || 'status';
      errorCode = errorCode || 1;

      // If type is valid (recognizeable string), create colored message.
      if (typeColors.hasOwnProperty(type)) {
        entry = typeColors[type](message);
      }

      // If type is invalid, return message and let the user know.
      else {
        entry = message + ' (NOTE: "' + type + '" is not a proper log type. Please use "notice", "warning", "error", "status", or "success")';
      }

      // If this is an error, log as an error.
      if (type === 'error') {
        console.error(message);
        process.exit(errorCode);
      }

      // If this is any other type of message, log as a simple string.
      else {
        console.log(entry);
      }

      resolve();
    })
  }
}

module.exports = Console;
