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

    // If this package is not installed, use passed in source param.
    // If none is passed in, default to name property.
    // (npm install /path/to/module || npm install published-module-name)
    if (!this.installed) {
      this.source = source || this.name;
    }

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
      this.download()

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
    })
  }

  /**
   * Uninstalls this extension.
   * @returns {object} promise object.
   */
  uninstall() {
    return new Promise((resolve, reject) => {
      // npm install extension.
      let p = exec('cd ' + path.join(this.aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + this.name, (error, stdout, stderr) => {
        if (error) {
          reject('Could not remove ' + this.name + ': ' + error);
          return;
        }

        // Remove configuration from aquifer.json.
        let extensions = this.aquifer.project.config.extensions;
        delete extensions[this.name];
        this.aquifer.project.updateJson({
          extensions: extensions
        });

        this.loadConfig();
        resolve();
      });

      p.stdout.pipe(process.stdout)
      p.stderr.pipe(process.stdout);
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

      let extension = require(this.path)(this.aquifer, this.config) || false;
      resolve(extension);
    })
  };

  /**
   * Downloads this extension.
   * @returns {object} promise object.
   */
  download() {
    return new Promise((resolve, reject) => {
      // Set command to link if local.
      let command = this.isLocal ? 'link' : 'install';
      let vendor  = path.join(this.aquifer.project.directory, '.aquifer');

      // If the .aquifer directory does not exist yet, create it.
      if (!this.pathExists(vendor)) {
        // Make the directory.
        fs.mkdirSync(vendor);

        // Copy src/package.json into .aquifer/package.json.
        fs.copySync(path.join(this.aquifer.project.srcDir, 'package.json'), path.join(vendor, 'package.json'));
      }

      // Download the extensions.
      let p = exec('cd ' + vendor + ' && npm ' + command + ' --save ' + this.source, (error, stdout, stderr) => {
        if (error) {
          reject('Could not download ' + this.name + ': ' + error);
          return;
        }

        resolve();
      });

      p.stdout.pipe(process.stdout)
      p.stderr.pipe(process.stdout);
    })
  }

  /**
   * Loads configuration for this extension.
   * @returns {undefined} nothing.
   */
  loadConfig() {
    this.path = path.join(this.aquifer.projectDir, '.aquifer/node_modules/' + this.name);
    this.downloaded = !!this.pathExists(this.path);
    this.installed = !!this.aquifer.project.config.extensions.hasOwnProperty(this.name);
    this.source = (this.installed && this.aquifer.project.config.extensions[this.name].hasOwnProperty('source')) ? this.aquifer.project.config.extensions[this.name].source : false;
    this.config = (this.installed && this.aquifer.project.config.extensions[this.name].hasOwnProperty('config')) ? this.aquifer.project.config.extensions[this.name].config : {};
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
