/**
 * @file
 * Contains main Aquifer class.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;
const jsonFile = require('jsonfile');
const path = require('path');
const mergeDefaults = require('merge-defaults');

// Allow for deepDefaults without merging arrays. This is useful for run
// scripts defined in aquifer.local.json. The expected behavior is that a run
// script in aquifer.local.json should completely overwrite a script of the same
// name in aquifer.json. The regular deepDefaults method merges the two arrays.
_.mixin({'defaultsDeepNoArrays': mergeDefaults});

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
    this.version = '1.0.0';
    this.cli = require('commander');
    this.cwd = process.cwd();
    this.initialized = false;
    this.projectDir = false;
    this.environment = false;
    this.allSrcDir = path.join(path.dirname(fs.realpathSync(__filename)), '../src/all');
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
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~  _  __  ~~~~~~~~~~~~~',
        '~~~~  __ _  __ _ _   _(_)/ _| ___ _ __  ~~~',
        '~~~  / _` |/ _` | | | | | |_ / _ \\` __|  ~~',
        '~~  | (_| | (_| | |_| | |  _|  __/| |  ~~~~',
        '~~~  \\__,_|\\__, |\\__,_|_|_|  \\___||_|  ~~~~',
        '~~~~~~~~~~~~  |_|  ~~~~~~~~~~~~~~~~~~~~~~~~',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
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
      this.getProjectDir()
      .then(() => {
        if (this.projectDir) {
          this.initialized = true;
        }
        return this.getConfig();
      })
      .then(() => {
        return this.switchVersion();
      })
      .then(() => {
        if (this.initialized) {
          this.project = new this.api.project(this);
        }
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      })
    });
  }

  /**
   * Find the current Aquifer project root.
   * @returns {object} promise object.
   */
  getProjectDir() {
    return new Promise((resolve, reject) => {
      // Traverse cwd, and find the aquifer project dir.
      let dir = this.cwd;
      while (this.projectDir === false && dir.length > 0) {
        if (fs.existsSync(dir + '/aquifer.json')) {
          this.projectDir = dir;
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
      // If Aquifer has initialized, require core and extension commands.
      if (this.initialized) {
        require('../lib/build.command')(this);
        require('../lib/run.command')(this);
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

      // If command is empty, show help message.
      if (!command.length) {
        this.console.log(this.art + '\n', 'success');
        if (this.initialized === false) {
          this.console.log('To create a Drupal site, run: "aquifer create <sitename>"', 'notice');
        }

        this.cli.outputHelp();
      }

      // If arguments are passed, and are valid, parse. Allow flags and valid cmds.
      else if (command[0] in this.cli._events || command[0].charAt(0) === '-') {
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

  /**
   * Get initial project configuration.
   * @returns {object} promise object.
   */
  getConfig() {
    return new Promise((resolve, reject) => {
      this.initialConfig = {};

      // If this project is initialized, load the JSON path.
      if (this.initialized) {
        // Calculate paths to json, and source directory.
        let jsonPath = path.join(this.projectDir, 'aquifer.json');
        let localJsonPath = path.join(this.projectDir, 'aquifer.local.json');

        this.initialConfig = jsonFile.readFileSync(jsonPath);

        // Extend config with aquifer.local.json.
        if (fs.existsSync(localJsonPath)) {

          this.initialConfig = _.defaultsDeepNoArrays(jsonFile.readFileSync(localJsonPath), this.initialConfig);
        }
      }

      resolve();
    })
  }

  /**
   * Redirects execution to the proper version of aquifer.
   * @returns {object} promise object.
   */
  switchVersion() {
    return new Promise((resolve, reject) => {
      // No need to switch aquifer versions if we don't have an aquifer project, yet.
      if (!this.initialized) {
        resolve();
        return;
      }

      if (!this.initialConfig.hasOwnProperty('version')) {
        this.console.log('You have not specified an aquifer version in aquifer.json. Using the default installed version: ' + this.version, 'warning');
        resolve();
        return;
      }

      if (this.initialConfig.version === this.version) {
        resolve();
        return;
      }

      let source = this.initialConfig.source || 'aquifer@' + this.initialConfig.version;

      let newAquifer = new this.api.npm(this, 'aquifer', source);

      if (newAquifer.installed) {
        let newAquiferDir = fs.realpathSync(path.join(newAquifer.path));
        let aquiferDir = fs.realpathSync(path.join(path.dirname(module.parent.filename), '..'));

        // Since the child aquifer module is installed, if the child module and
        // this current instance of aquifer have the same directory, then we are
        // running a chained instance of aquifer. If that chained instance
        // doesn't have a matching version property, we have a problem.
        if (aquiferDir === newAquiferDir && this.initialConfig.version !== this.version) {
          reject('You have specified a version of aquifer that does not match the version that was installed. You probably have misconfigured source or version properties in your aquifer.json file.');
          return;
        }
      }

      // Install the right version of Aquifer.
      let installAquifer = new Promise((installResolve, installReject) => {
        // Return early if Aquifer is already installed.
        if (newAquifer.installed) {
          installResolve();
          return;
        }

        // Let the user know we'll be installing the specified version of aquifer now.
        this.console.log('Aquifer ' + this.initialConfig.version + ' is not installed. Installing now...');

        newAquifer.install()
        .then(() => {
          installResolve();
        })
        .catch((reason) => {
          installReject(reason);
        })
      });

      installAquifer.then(() => {
        let command = path.join(newAquifer.path, '../.bin/aquifer');

        // Execute aquifer with the proper version.
        let p = spawn(command, process.argv.slice(2), {stdio: 'inherit'});

        p.on('close', () => {
          process.exit();
        })
      })
      .catch((reason) => {
        reject(reason);
      });
    });
  }
}

module.exports = Aquifer;
