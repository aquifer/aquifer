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
/* globals require, process */

var Aquifer = {};
Aquifer.console = require('../lib/console.api.js')(Aquifer);
Aquifer.init = require('../lib/init.api.js')(Aquifer);

// APIs.
Aquifer.api = {
  project: require('../lib/project.api.js')(Aquifer),
  build: require('../lib/build.api.js')(Aquifer),
  refresh: require('../lib/refresh.api.js')(Aquifer)
}

// Initialize.
Aquifer.init.setup();

// Commands.
Aquifer.command = {
  create: require('../lib/create.command.js')(Aquifer),
  build: require('../lib/build.command.js')(Aquifer),
  refresh: require('../lib/refresh.command.js')(Aquifer)
}

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
