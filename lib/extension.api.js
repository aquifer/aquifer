/**
 * @file
 * Defines an extension api for the aquifer cli.
 */

'use strict';

// Load dependencies.
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs-extra');

/**
 * Constructs extension API for Aquifer.
 *
 * @class
 * @classdesc Contains extension API for Aquifer.
 */
class Extension {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer active instance of Aquifer.
   * @param {string} name machine-friendly name of extension.
   * @param {string} source extension source. This could be any value recognized by `npm install <source>`.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer, name, source) {
    this.aquifer = Aquifer;
    this.name = name || null;

    // Load config.
    this.loadConfig();

    // If this is installed, load the source from config.
    if (this.installed) {
      this.source = this.config.source;
    }
    // If this package is not installed, use passed in source param.
    // If none is passed in, default to name property.
    // (npm install /path/to/module || npm install published-module-name)
    else {
      this.source = source || this.name;
    }

    // Construct the npm module instance.
    this.npmModule = new this.aquifer.api.npm(this.aquifer, this.name, this.source);

    // Use the source value to determine whether the extension is local.
    this.isLocal = this.pathExists(this.source);
  }

  /**
   * Installs this extension.
   * @returns {object} promise object.
   */
  install() {
    return new Promise((resolve, reject) => {
      // Download this extension.
      this.npmModule.install()

      // Update extensions object in aquifer.json.
      .then(() => {
        let extensions = this.aquifer.project.config.extensions;
        extensions[this.name] = { source: this.source };
        this.aquifer.project.updateJson({
          extensions: extensions
        });

        this.loadConfig();
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      });
    })
  }

  /**
   * Uninstalls this extension.
   * @returns {object} promise object.
   */
  uninstall() {
    return new Promise((resolve, reject) => {
      // npm uninstall extension.
      this.npmModule.uninstall()

      .then(() => {
        // Remove configuration from aquifer.json.
        let extensions = this.aquifer.project.config.extensions;
        delete extensions[this.name];
        this.aquifer.project.updateJson({
          extensions: extensions
        });

        this.loadConfig();
        resolve();
      });
    })
  }

  /**
   * Loads and an extension npm module.
   * @returns {object} promise object.
   */
  load() {
    return new Promise((resolve, reject) => {
      // If the extension is installed but not downloaded,
      // tell the user to reload the extensions.
      if (this.installed && !this.downloaded) {
        reject('The ' + this.name + ' extension has not been downloaded. Please run "aquifer extensions-load".');
        return;
      }

      // If the extension is not installed or downloaded, exit.
      if (!this.installed && !this.downloaded) {
        reject('Cannot load extension ' + this.name + ', it is not installed or configured.');
        return;
      }

      let extension = this.npmModule.load([this.aquifer, this.config]) || false;
      resolve(extension);
    })
  };

  /**
   * Downloads this extension.
   * @returns {object} promise object.
   */
  download() {
    return new Promise((resolve, reject) => {
      this.npmModule.install()

      // Reload config.
      .then(() => {
        this.loadConfig();
        resolve();
      })
    });
  }

  /**
   * Loads configuration for this extension.
   * @returns {undefined} nothing.
   */
  loadConfig() {
    this.path = path.join(this.aquifer.projectDir, '.aquifer/node_modules/' + this.name);
    this.config = this.aquifer.project.config.extensions.hasOwnProperty(this.name) ? this.aquifer.project.config.extensions[this.name] : false;
    this.installed = this.config ? true : false;
    this.downloaded = this.pathExists(this.path) ? true : false;
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

module.exports = Extension;
