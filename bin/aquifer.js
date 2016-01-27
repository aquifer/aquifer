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

AquiferAPI.prototype.console = new Console();
AquiferAPI.prototype.api = {
  project: Project,
  build: Build,
  refresh: require('../lib/refresh.api')(AquiferAPI),
  extension: require('../lib/extension.api')(AquiferAPI)
}

// Create instance of AquiferAPI.
const Aquifer = new AquiferAPI();

// Initialize the command line interface.
Aquifer.initializeCli()

// Initialize the project, if cwd is an Aquifer project.
.then(() => {
  Aquifer.initializeProject()
})

// Load and execute command definitions.
.then(() => {
  Aquifer.initializeCommands(Aquifer)
})

// Execute commander parser.
.then(() => {
  // If no arguments passed in, output cli docs. Else parse.
  if (!process.argv.slice(2).length) {
    Aquifer.console.log(Aquifer.art + '\n', 'success');
    if (Aquifer.initialized === false) {
      Aquifer.console.log('To create a Drupal site, run: "aquifer create <sitename>"', 'notice');
    }

    Aquifer.cli.outputHelp();
  }
  else {
    Aquifer.cli.parse(process.argv);
  }

})

// Catch, and properly throw any errors.
.catch((reason) => {
  console.error(reason);
});
