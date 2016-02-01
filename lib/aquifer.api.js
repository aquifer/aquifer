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
    this.environment = false;
  }

  /**
   * Initialize the Aquifer cli.
   * @returns {object} promise object.
   */
  initializeCli() {
    return new Promise((resolve, reject) => {
      this.cli
      .version(this.version)
      .usage('command [options]')
      .option('-e, --env', 'Run command against an environment.');

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
   * @returns {object} promise object.
   */
  initializeCommands() {
    return new Promise((resolve, reject) => {
      // Require 'create' command.
      require('../lib/create.command')(this);
      // If Aquifer has initialized, require build, refresh, and extension commands.
      if (this.initialized) {
        require('../lib/build.command')(this);
        require('../lib/refresh.command')(this);
        require('../lib/extension.command')(this);
        require('../lib/environment.command')(this);
      }

      resolve();
    });
  }

  /**
   * Parses current input and executes Aquifer
   * @returns {object} promise object.
   */
  parse() {
    return new Promise((resolve, reject) => {
      // If no arguments passed in, output cli docs.
      let command = process.argv.slice(2);

      // Decide the current environment.
      if (!command.length) {
        this.console.log(this.art + '\n', 'success');
        if (this.initialized === false) {
          this.console.log('To create a Drupal site, run: "aquifer create <sitename>"', 'notice');
        }

        this.cli.outputHelp();
      }

      // If arguments are passed, and are valid, parse. Allow flags and valid cmds.
      else if (this.cli._events.hasOwnProperty(command[0]) || command[0].charAt(0) === '-') {
        // Set environment if it's specified.
        let envFlag = command.indexOf('-e') > -1 ? command.indexOf('-e') : command.indexOf('--env');
        envFlag = envFlag > -1 ? command[envFlag + 1] : false;

        if (envFlag) {
          this.environment = new this.api.environment(this, envFlag);
          if (!this.environment.installed) {
            reject('environment "' + envFlag + '" does not exist.');
            return;
          }
        }

        this.cli.parse(process.argv);
      }

      // If arguments passed in are not parseable, error.
      else {
        reject('"' + command + '" is an invalid command or flag.');
      }

      resolve();
    })
  }
}

module.exports = Aquifer;
