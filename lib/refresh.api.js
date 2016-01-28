/**
 * @file
 * Defines aa refresh api for the aquifer cli.
 */

'use strict';

// Load dependencies.
const drush = require('drush-node');

/**
 * Constructs refresh API for Aquifer.
 *
 * @class
 * @classdesc Contains refresh API for Aquifer.
 */
class Refresh {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    this.aquifer = Aquifer;
  }

  /**
   * Executes a full site refresh against specified target.
   * @param {string} target Either a site alias for running the command remotely or a directory for running it locally.
   * @returns {object} promise object.
   */
  execute(target) {
    return new Promise((resolve, reject) => {

      // If Aquifer has not been initialized, exit.
      if (!this.aquifer.initialized) {
        reject('Cannot build a project that hasn\'t been initialized.');
        return;
      }

      // Start array of commands and determine target location.
      let location = target.indexOf('@') === 0 ? [target] : ['-r', target];
      let sequence = Promise.resolve();

      // Initialize Drush.
      sequence = sequence.then(drush.init);

      // Create an array of commands to run.
      this.aquifer.project.config.refreshCommands.forEach((args) => {
          sequence = sequence.then(() => {
            drush.exec(location.concat(args), { log: true });
          })
      })
    })
  }
}

module.exports = Refresh;
