/**
 * @file
 * Defines an npm api for the aquifer cli.
 */

'use strict';

// Load dependencies.
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs-extra');

/**
 * Constructs the npm API for Aquifer.
 *
 * @class
 * @classdesc Contains npm API for Aquifer.
 */
class Npm {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer active instance of Aquifer.
   * @param {string} name machine-friendly name of the module.
   * @param {string} source module source. This could be any value recognized by `npm install <source>`.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer, name, source) {
    this.aquifer = Aquifer;
    this.name = name || null;

    this.path = path.join(this.aquifer.projectDir, '.aquifer/node_modules/' + this.name);
    this.installed = this.pathExists(this.path) ? true : false;
    this.source = source || this.name;

    // Use the source value to determine whether the module is local.
    this.isLocal = this.pathExists(this.source);
  }

  /**
   * Uninstalls the module.
   * @returns {object} promise object.
   */
  uninstall() {
    return new Promise((resolve, reject) => {
      // npm uninstall module.
      let p = exec('cd ' + path.join(this.aquifer.projectDir, '.aquifer') + ' && npm uninstall --save ' + this.name, (error, stdout, stderr) => {
        if (error) {
          reject('Could not remove ' + this.name + ': ' + error);
          return;
        }

        this.installed = false;

        resolve();
      });

      p.stdout.pipe(process.stdout)
      p.stderr.pipe(process.stdout);
    })
  }

  /**
   * Loads an npm module.
   * @param {array} args array of arguments to pass to the module constructor.
   * @returns {object} promise object.
   */
  load(args) {
    return new Promise((resolve, reject) => {
      if (!this.installed) {
        reject('The ' + this.name + ' module has not been installed.');
        return;
      }

      args = args || [];

      let npmModule = require(this.path)(...args) || false;
      resolve(npmModule);
    })
  };

  /**
   * Installs this module.
   * @returns {object} promise object.
   */
  install() {
    return new Promise((resolve, reject) => {
      // Do not install a module that is already installed.
      if (this.installed) {
        reject('The ' + this.name + ' module is already installed.');
        return;
      }

      // Set command to link if local.
      let command = this.isLocal ? 'link' : 'install';
      let vendor  = path.join(this.aquifer.projectDir, '.aquifer');

      // If the .aquifer directory does not exist yet, create it.
      if (!this.pathExists(vendor)) {
        // Make the directory.
        fs.mkdirSync(vendor);

        // Copy src/package.json into .aquifer/package.json.
        fs.copySync(path.join(this.aquifer.project.srcDir, 'package.json'), path.join(vendor, 'package.json'));
      }

      // Install the module.
      let p = exec('cd ' + vendor + ' && npm ' + command + ' --save ' + this.source, (error, stdout, stderr) => {
        if (error) {
          reject('Could not install ' + this.name + ': ' + error);
          return;
        }

        this.installed = true;

        resolve();
      });

      p.stdout.pipe(process.stdout)
      p.stderr.pipe(process.stdout);
    })
  }

  /**
   * Determines whether or not a path exists.
   * @param {string} toCheck path for which this function will check for existence.
   * @returns {boolean} true if path exists, false if else.
   */
  pathExists(toCheck) {
    try {
      fs.statSync(toCheck);
    }
    catch (error) {
      return false;
    }

    return true;
  }
}

module.exports = Npm;
