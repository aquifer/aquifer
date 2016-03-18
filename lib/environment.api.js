/**
 * @file
 * Contains the environment API for Aquifer.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const spawn = require('child_process').spawn;
const ssh = require('ssh2');
const untildify = require('untildify');
const fs = require('fs-extra');

/**
 * Constructs environment API for Aquifer.
 *
 * @class
 * @classdesc Contains environment API for Aquifer.
 */
class Environment {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer current instance of Aquifer.
   * @param {string} name corresponding with environment name in aquifer.json.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer, name) {
    this.aquifer = Aquifer;
    this.name = name || false;
    this.installed = Aquifer.project.config.environments.hasOwnProperty(name) ? true : false;

    // If this is already installed, load class properties.
    if (this.installed) {
      this.load();
    }
  }

  /**
   * Adds this environment to the aquifer.json file.
   * @param {object} config configuration for the environment being created.
   * @returns {object} promise object.
   */
  add(config) {
    return new Promise((resolve, reject) => {
      // If this has already been added to the project config, reject.
      if (this.installed) {
        reject('A "' + this.name + '" environment already exists in aquifer.json, or aquifer.local.json');
        return;
      }

      // Load properties for this class.
      this.load(config);

      // Validate, and then add to project json.
      this.validate()
      .then(() => {
        // Add environment to aquifer.json.
        let environments = this.aquifer.project.config.environments;
        environments[this.name] = this.config;
        this.aquifer.project.updateJson({
          environments: environments
        })
        .then(() => {
          resolve();
        })
      })
      .catch((reason) => {
        reject(reason);
      })
    })
  }

  /**
   * Removes this environment from the aquifer.json file.
   * @returns {object} promise object.
   */
  remove() {
    return new Promise((resolve, reject) => {
      // If this environment doesn't exist, reject.
      if (!this.installed) {
        reject('No environment with the name "' + this.name + '" exists');
        return;
      }

      // Remove environment from aquifer.json.
      let environments = this.aquifer.project.config.environments;
      delete environments[this.name];
      this.aquifer.project.updateJson({
        environments: environments
      })
      .then(() => {
        resolve();
      })
    });
  }

  /**
   * Pings an environment and ensure it's accessible.
   * @returns {object} promise object.
   */
  ping() {
    return new Promise((resolve, reject) => {
      // If this environment doesn't exist, reject.
      if (!this.installed) {
        return reject('No environment with the name "' + this.name + '" exists');
      }

      // Create a new connection.
      let connection = new ssh.Client();

      // When the connection is ready...
      connection.on('ready', () => {
        connection.end();
        resolve();
      }).on('error', (reason) => {
        reject(reason);
      }).connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.user,
        privateKey: fs.readFileSync(untildify(this.config.key))
      })
    })
  }

  /**
   * Loads this environments config from aquifer.json or from passed-in props.
   * @param {object} config configuration for this environment, if it's being created or can't be loaded from aquifer.json
   * @returns {undefined} nothing.
   */
  load(config) {
    // Load and assign this environment config.
    if (this.installed) {
      this.config = this.aquifer.project.config.environments[this.name];
    }
    else if (config.constructor === Object) {
      this.config = config;
    }

    // Filter allowed values.
    let allowed = {
      host: true,
      port: true,
      user: true,
      key: true,
      paths: true
    };

    // Delete any unapproved keys.
    Object.keys(this.config).forEach((key) => {
      if (!allowed.hasOwnProperty(key)) {
        delete config[key];
      }
    });

    // Provide default value for port.
    this.config.port = this.config.hasOwnProperty('port') ? this.config.port : 22;
  }

  /**
   * Validates the configuration of this environment.
   * @returns {object} promise object.
   */
  validate() {
    return new Promise((resolve, reject) => {

      // If paths are malformed or not provided, exit.
      if (!this.config.hasOwnProperty('paths') || this.config.paths.constructor !== Object) {
        reject('"paths" must exist and must be of type Object.');
      }

      // If this is a remote environment, make sure we have the right details.
      if (!this.config.hasOwnProperty('port') || this.config.port.constructor !== Number) {
        reject('"port" must exist as a Number.');
      }

      if (!this.config.hasOwnProperty('user') || this.config.user.constructor !== String) {
        reject('"user" must exist and must be of type String.');
      }

      if (!this.config.hasOwnProperty('key') || this.config.key.constructor !== String) {
        reject('"key" must exist and must be of type String.');
      }

      resolve();
    })
  }
}

module.exports = Environment;