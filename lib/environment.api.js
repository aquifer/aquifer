/**
 * @file
 * Contains the environment API for Aquifer.
 */

'use strict';

// Load dependencies.
const rs = require('fs-extra');

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
        reject('This environment already exists in aquifer.json, or aquifer.local.json');
        return;
      }

      // Load properties for this class and validate.
      this.load(config);

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
  }

  /**
   * Removes this environment from the aquifer.json file.
   * @returns {object} promise object.
   */
  remove() {
    return new Promise((resolve, reject) => {
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
    })
  }

  /**
   * Validates the configuration of this environment.
   * @returns {object} promise object.
   */
  isValid() {
    return new Promise((resolve, reject) => {

      let message = {
        prefix: 'Environment ' + this.name + ' ',
        suffix: '. Check the "environments" property in your aquifer.json or aquifer.local.json files.'.
      }

      // If "isRemote" is not a boolean.
      if (!this.config.hasOwnProperty('isRemote') || this.config.isRemote.constructor !== Boolean) {
        reject(message.prefix + 'must have a Boolean value assigned to the "isRemote" property' + message.suffix);
      }

      // If paths are malformed or not provided, exit.
      if (!this.config.hasOwnProperty('paths') || this.config.paths.constructor !== Object) {
        reject(message.prefix + 'must have the property "paths". The value of this property should be an object with a "build": "/path/to/build" subproperty.' + message.suffix);
      }

      // If this is a remote environment, make sure we have the right details.
      if (this.config.isRemote === true) {
        if (!this.config.hasOwnProperty('port') || this.config.port.constructor !== Number) {
          reject(message.suffix + 'must have a numeric value for the "port" property.');
        }

        if (!this.config.hasOwnProperty('user') || this.config.port.constructor !== String) {
          reject(message.suffix + 'must have a string value for the "user" property.');
        }

        if (!this.config.hasOwnProperty('key') || this.config.port.constructor !== String) {
          reject(message.suffix + 'must have a string path for the "key" property.');
        }
      }

      resolve();
    })
  }
}
