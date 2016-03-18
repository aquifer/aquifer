/**
 * @file
 * Contains the run API for Aquifer.
 */

'use strict';

// Load dependencies.
const spawn = require('child_process').spawn;
const parseArgs = require('parse-spawn-args').parse;

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
   * @returns {object} promise object.
   */
  invoke(command, options) {
    return new Promise((resolve, reject) => {
      command = this.parse(command);

      let child = spawn(command.name, command.args, options);

      child.stdout.on('data', (data) => {
        console.log(data.toString('utf8').trim());
      });

      child.stderr.on('data', (data) => {
        console.log(data.toString('utf8').trim());
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
   * Execute a set of commands.
   * @param {array} commands A set of commands to invoke.
   * @param {object} options Options to pass to spawn.
   * @returns {object} promise object.
   */
  invokeAll(commands, options) {
    let chain = Promise.resolve()

    // Execute the command chain.
    commands.forEach((command) => {
      chain = chain.then(() => {
        return this.invoke(command, options);
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
