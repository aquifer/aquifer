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

// Load Aquifer class and extend with libraries.
const AquiferAPI = require('../lib/aquifer.api');
AquiferAPI.prototype.console = require('../lib/console.api')(AquiferAPI);
AquiferAPI.prototype.api = {
  project: require('../lib/project.api')(AquiferAPI),
  build: require('../lib/build.api')(AquiferAPI),
  refresh: require('../lib/refresh.api')(AquiferAPI),
  extension: require('../lib/extension.api')(AquiferAPI)
}

// Create instance of AquiferAPI.
const Aquifer = new AquiferAPI();

// Initialize cli, and project.
Aquifer.initializeCli()
.then(Aquifer.initializeProject)
.then(() => {
  require('../lib/create.command')(Aquifer);
  require('../lib/build.command')(Aquifer);
  require('../lib/refresh.command')(Aquifer);
  require('../lib/extension.command')(Aquifer);
});

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
