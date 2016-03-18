/**
 * @file
 * Contains commands related to environment management.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const untildify = require('untildify');

/**
 * Defines commands related to interacting with environments.
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {
  let command;

  /**
   * Create 'envs' command that lists all available environments.
   */
  command = Aquifer.cli.command('envs');
  command.description('List all available environments.');
  command.action(() => {
    // If there are no extensions installed, exit.
    if (!Aquifer.project.config.hasOwnProperty('environments') || Object.keys(Aquifer.project.config.environments).length <= 0) {
      Aquifer.console.log('No environments have been defined.', 'warning');
      return;
    }

    // Loop through extensions, and log.
    _.each(Aquifer.project.config.environments, function(config, name) {
      Aquifer.console.log(name, 'notice');
    })
  });

  /**
   * Create 'env-remove <name>' command that allows users to remove environments.
   */
  command = Aquifer.cli.command('env-remove <name>');
  command.description('Remove an existing environment.');
  command.action((name) => {
    let env = new Aquifer.api.environment(Aquifer, name);
    env.remove()
    .then(() => {
      Aquifer.console.log('Removed "' + name + '" environment.', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
  });

  /**
   * Create 'ping <name>' command that allows users to ensure an environment exists.
   */
  command = Aquifer.cli.command('ping <name>');
  command.description('Ping an existing environment to make sure it exists and is accessible');
  command.action((name) => {
    let env = new Aquifer.api.environment(Aquifer, name);
    env.prompt()
    .then(() => {
      return env.ping();
    })
    .then(() => {
      Aquifer.console.log('The "' + name + '" environment exists and is accessible!', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
  });

  /**
   * Create 'env-add' command that allows users to add environments.
   */
  command = Aquifer.cli.command('env-add');
  command.description('Define a new environment.');
  command.action(() => {
    // Define a list of questions.
    let questions = [];

    questions.push({
      type: 'input',
      name: 'name',
      message: 'What is the (machine) name of this environment?',
      validate: (value) => {
        if (value.length === 0) {
          return 'Please provide a value.';
        }

        if (value.match(/[^a-zA-Z0-9]/)) {
          return 'Invalid name. No spaces or special characters allowed.';
        }

        let env = new Aquifer.api.environment(Aquifer, value);
        if (env.installed === true) {
          return 'An environment with this name already exists.';
        }

        return true;
      }
    });

    questions.push({
      type: 'input',
      name: 'host',
      message: 'What is the host? (example: localhost, 192.168.11.22, or test.com)',
      validate: (value) => {
        if (value.length === 0) {
          return 'Please provide a value.';
        }

        return true;
      }
    });

    questions.push({
      type: 'input',
      name: 'port',
      message: 'On what port should ssh connect to this environment?',
      default: 22,
      validate: (value) => {
        if (value.length === 0) {
          return 'Please provide a value.';
        }

        return true;
      }
    });

    questions.push({
      type: 'input',
      name: 'user',
      message: 'What user should be used to connect to this environment?',
      validate: (value) => {
        if (value.length === 0) {
          return 'Please provide a value.';
        }

        return true;
      }
    });

    questions.push({
      type: 'input',
      name: 'key',
      message: 'What key should be used when connecting to this environment?',
      validate: (value) => {
        try {
          fs.statSync(untildify(value));
        }
        catch (e) {
          return 'Specified path does not exist. Please specify an absolute path to a key file on your system, like ~/.ssh/id_rsa, or ~/.vagrant.d/insecure_private_key for vagrant boxes';
        }

        return true;
      }
    });

    questions.push({
      type: 'confirm',
      name: 'passwordPrompt',
      message: 'Does the private key require a password?',
      default: false
    });

    questions.push({
      type: 'input',
      name: 'pathDrupal',
      message: 'What is the absolute path to the Drupal root on this environment?',
      validate: (value) => {
        if (value.length === 0) {
          return 'Please provide a value.';
        }

        return true;
      }
    });

    questions.push({
      type: 'input',
      name: 'pathAquifer',
      message: 'What is the absolute path to the Aquifer root on this environment? (optional)'
    });

    // Prompt the user to answer these questions.
    inquirer.prompt(questions, (config) => {

      // Create new instance of environment API.
      let name = config.name;
      let env = new Aquifer.api.environment(Aquifer, name);

      config.paths = {
        aquifer: config.pathAquifer,
        drupal: config.pathDrupal
      }

      // Add the environment.
      env.add(config)
      .then(() => {
        Aquifer.console.log('Added "' + name + '" environment.', 'success');
      })
      .catch((reason) => {
        Aquifer.console.log(reason, 'error');
      })
    })
  })
}
