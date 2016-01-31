#!/usr/bin/env node

/**
 * @file
 * Defines aquifer command line interface.
 *
 *                    _  __
 *   __ _  __ _ _   _(_)/ _| ___ _ __
 *  / _` |/ _` | | | | | |_ / _ \ '__|
 * | (_| | (_| | |_| | |  _|  __/ |
 *  \__,_|\__, |\__,_|_|_|  \___|_|
 *           |_|
 */

'use strict';

// Load Aquifer class and extend with libraries.
const AquiferAPI = require('../lib/aquifer.api');
const Console = require('../lib/console.api');
const Project = require('../lib/project.api');
const Build = require('../lib/build.api');
const Extension = require('../lib/extension.api');
const Environment = require('../lib/environment.api');
const Refresh = require('../lib/refresh.api');

AquiferAPI.prototype.console = new Console();
AquiferAPI.prototype.api = {
  project: Project,
  build: Build,
  extension: Extension,
  environment: Environment,
  refresh: Refresh
}

// Create instance of AquiferAPI.
const Aquifer = new AquiferAPI();

// Initialize the command line interface.
Aquifer.initializeCli()

// Initialize the project, if cwd is an Aquifer project.
.then(() => {
  return Aquifer.initializeProject()
})

// Load and execute command definitions.
.then(() => {
  return Aquifer.initializeCommands(Aquifer)
})

// Execute commander parser.
.then(() => {
  // If no arguments passed in, output cli docs.
  let command = process.argv.slice(2);
  if (!command.length) {
    Aquifer.console.log(Aquifer.art + '\n', 'success');
    if (Aquifer.initialized === false) {
      Aquifer.console.log('To create a Drupal site, run: "aquifer create <sitename>"', 'notice');
    }

    Aquifer.cli.outputHelp();
  }

  // If arguments are passed, and are valid, parse.
  else if (Aquifer.cli._events.hasOwnProperty(command[0])) {
    Aquifer.cli.parse(process.argv);
  }

  // If arguments passed in are not parseable, error.
  else {
    Aquifer.console.log('"' + command + '" is an invalid command.', 'error', 127);
  }
})

// Catch, and properly throw any errors.
.catch((reason) => {
  console.error(reason);
})
