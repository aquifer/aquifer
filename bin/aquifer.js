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
const Run = require('../lib/run.api');
const Extension = require('../lib/extension.api');
const Environment = require('../lib/environment.api');
const Sync = require('../lib/sync.api');

AquiferAPI.prototype.console = new Console();
AquiferAPI.prototype.api = {
  project: Project,
  build: Build,
  run: Run,
  extension: Extension,
  environment: Environment,
  sync: Sync
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
  return Aquifer.initializeCommands();
})

// Execute commander parser.
.then(() => {
  return Aquifer.parse();
})

// Catch, and properly throw any errors.
.catch((reason) => {
  Aquifer.console.log(reason, 'error');
})
