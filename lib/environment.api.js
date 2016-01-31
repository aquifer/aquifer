/**
 * @file
 * Contains the environment API for Aquifer.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');

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

      // Load properties for this class and validate.
      this.load(config)
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
   * Loads this environments config from aquifer.json or from passed-in props.
   * @param {object} config configuration for this environment, if it's being created or can't be loaded from aquifer.json
   * @returns {object} promise object.
   */
  load(config) {
    return new Promise((resolve, reject) => {

      // Filter allowed values.
      let allowed = {
        isRemote: true,
        host: true,
        port: true,
        user: true,
        key: true,
        paths: true
      };

      // Delete any unapproved keys.
      Object.keys(config).forEach((key) => {
        if (!allowed.hasOwnProperty(key)) {
          delete config[key];
        }
      });

      // Load and assign this environment config.
      if (this.installed) {
        this.config = this.aquifer.project.config.environments[this.name];
      }
      else if (config.constructor === Object) {
        this.config = config;
      }

      // Provide default value for isRemote.
      if (!this.config.hasOwnProperty('isRemote')) {
        this.config.isRemote = this.config.hasOwnProperty('key') ? true : false;
      }

      // Provide default value for port.
      this.config.port = this.config.hasOwnProperty('port') ? this.config.port : 22;

      // Validate this config.
      this.validate()
      .then(() => {
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      });
    })
  }

  /**
   * Validates the configuration of this environment.
   * @returns {object} promise object.
   */
  validate() {
    return new Promise((resolve, reject) => {

      // If "isRemote" is not a boolean.
      if (!this.config.hasOwnProperty('isRemote') || this.config.isRemote.constructor !== Boolean) {
        reject('"isRemote" must be exist and must be of type Boolean.');
      }

      // If paths are malformed or not provided, exit.
      if (!this.config.hasOwnProperty('paths') || this.config.paths.constructor !== Object) {
        reject('"paths" must exist and must be of type Object.');
      }

      // If this is a remote environment, make sure we have the right details.
      if (this.config.isRemote === true) {
        if (!this.config.hasOwnProperty('port') || this.config.port.constructor !== Number) {
          reject('"port" must exist as a Number.');
        }

        if (!this.config.hasOwnProperty('user') || this.config.user.constructor !== String) {
          reject('"user" must exist and must be of type String.');
        }

        if (!this.config.hasOwnProperty('key') || this.config.key.constructor !== String) {
          reject('"key" must exist and must be of type String.');
        }
      }

      resolve();
    })
  }
}

module.exports = Environment;
