/**
 * @file
 * Contains main Aquifer class.
 */

'use strict';

// Load dependencies.
const fs = require('fs-extra');

/**
 * Constructs a main Aquifer project.
 * @class
 * @classdesc Contains Aquifer initialization tools.
 */
class Aquifer {

  /**
   * Sets up class properties.
   * @returns {undefined} nothing.
   */
  constructor() {
    this.version = '0.1.4';
    this.cli = require('commander');
    this.cwd = process.cwd();
    this.initialized = false;
    this.projectDir = false;
  }

  /**
   * Initialize the Aquifer cli.
   * @returns {object} promise object.
   */
  initializeCli() {
    return new Promise((resolve, reject) => {
      this.cli
      .version(this.version)
      .usage('command [options]');

      // Set name.
      this.cli._name = 'aquifer';

      // Is this even a real thing if it doesn't have ascii art?
      this.art = [
        '                   _  __',
        '  __ _  __ _ _   _(_)/ _| ___ _ __',
        ' / _` |/ _` | | | | | |_ / _ \\ \'__|',
        '| (_| | (_| | |_| | |  _|  __/ |',
        ' \\__,_|\\__, |\\__,_|_|_|  \\___|_|',
        '          |_|'
      ].join('\n');

      resolve();
    });
  }

  /**
   * Initialize the current Aquifer project.
   * @returns {object} promise object.
   */
  initializeProject() {
    return new Promise((resolve, reject) => {
      // If cwd is not set, reject.
      if (!this.hasOwnProperty('cwd')) {
        reject('Unknown current working directory.');
      }

      // If this project is already initialized, reject.
      if (this.initialized) {
        reject('This project has already been initialized.');
      }

      // Traverse cwd, and find the aquifer project dir. If one does not exist
      // in the current path, the framework is not initialized.
      let dir = this.cwd;
      while (this.projectDir === false && dir.length > 0) {
        if (fs.existsSync(dir + '/aquifer.json')) {
          this.initialized = true;
          this.projectDir = dir;
          this.project = new this.api.project(this);
        }
        else {
          dir = dir.substring(0, dir.lastIndexOf('/'));
        }
      }

      resolve();
    });
  }

  /**
   * Loads and executes all command files.
   * @param {object} Aquifer instance of this class.
   * @returns {object} promise object.
   */
  initializeCommands(Aquifer) {
    return new Promise((resolve, reject) => {
      // Require 'create' command.
      require('../lib/create.command')(Aquifer);

      // If Aquifer has initialized, require build, refresh, and extension commands.
      if (Aquifer.initialized) {
        require('../lib/build.command')(Aquifer);
        require('../lib/refresh.command')(Aquifer);
        require('../lib/extension.command')(Aquifer);
      }

      resolve();
    });
  }
}

module.exports = Aquifer;
