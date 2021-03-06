/**
 * @file
 * Contains the run API for Aquifer.
 */

'use strict';

// Load dependencies.
const spawn = require('child_process').spawn;
const parseArgs = require('parse-spawn-args').parse;
const ssh = require('ssh2');
const fs = require('fs-extra');

/**
 * Constructs the run API for Aquifer.
 *
 * @class
 * @classdesc Contains the run API for Aquifer.
 */
class Run {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    this.aquifer = Aquifer;
  }

  /**
   * Invokes a single command.
   * @param {string} command The command to invoke.
   * @param {object} options Options to pass to spawn.
   * @param {string} env The name of the environment on which to invoke.
   * @returns {object} promise object.
   */
  invoke(command, options, env) {
    options = options || {};

    // Invoke on an environment.
    if (typeof env !== 'undefined') {
      return this.invokeOnEnv(command, env);
    }

    return new Promise((resolve, reject) => {
      command = this.parse(command);

      if (options.hasOwnProperty('cwd') && !fs.existsSync(options.cwd)) {
        reject('Trying to run a command from a location which does not exist: ' + options.cwd);
      }

      let child = spawn(command.name, command.args, options);

      child.stdout.on('data', (data) => {
        this.aquifer.console.log(data.toString('utf8').trim());
      });

      child.stderr.on('data', (data) => {
        this.aquifer.console.log(data.toString('utf8').trim());
      });

      child.on('close', (code) => {
        if (code !== 0) {
          return reject(command.name + 'command exited with code ' + code);
        }
        resolve();
      });
    })
  }

  /**
   * Invoke a command on an environment.
   * @param {string|array} commands The command or set of commands to invoke.
   * @param {string} env The name of the environment on which to invoke.
   * @returns {object} promist object.
   */
  invokeOnEnv(commands, env) {
    return new Promise((resolve, reject) => {
      let environment = new this.aquifer.api.environment(this.aquifer, env);

      // Make sure commands is an array.
      commands = commands.constructor !== Array ? [commands] : commands;

      environment.connect((connection) => {
        let chain = Promise.resolve();

        commands.forEach((command) => {
          chain = chain.then(() => {
            return new Promise((resolve, reject) => {
              connection.exec('cd ' + environment.config.paths.drupal + ' && ' + command, (err, stream) => {
                if (err) {
                  reject(err);
                }

                stream
                .on('close', (code, signal) => {
                  if (code !== 0) {
                    reject('Command exited with code ' + code + ' on environment ' + env);
                  }
                  resolve();
                })
                .on('data', (data) => {
                  this.aquifer.console.log(data.toString('utf8').trim());
                })
                .stderr.on('data', (data) => {
                  this.aquifer.console.log(data.toString('utf8').trim());
                })
              })
            })
          })
        })

        return chain;
      })
      .catch((reason) => {
        reject(reason);
      })
      .then(() => {
        resolve();
      })
    })
  }

  /**
   * Execute a set of commands.
   * @param {array} commands A set of commands to invoke.
   * @param {object} options Options to pass to spawn.
   * @param {string} env The name of the environment on which to invoke.
   * @returns {object} promise object.
   */
  invokeAll(commands, options, env) {
    options = options || {};

    // Invoke on an environment.
    if (typeof env !== 'undefined') {
      return this.invokeOnEnv(commands, env);
    }

    let chain = Promise.resolve()

    // Execute the command chain.
    commands.forEach((command) => {
      chain = chain.then(() => {
        return this.invoke(command, options, env);
      });
    });

    return chain;
  }

  /**
   * Parse a command string.
   * @param {string} command The command string to parse.
   * @returns {object} An object containing the name and arguments to pass to spawn.
   */
  parse(command) {
    return {
      name: command.substr(0, command.indexOf(' ')),
      args: parseArgs(command.substr(command.indexOf(' ') + 1))
    }
  }
}

module.exports = Run;
