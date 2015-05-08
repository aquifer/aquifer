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
/* globals require */

var Aquifer = {};
Aquifer.console = require('./lib/console.api.js')(Aquifer);
Aquifer.init = require('./lib/init.api.js')(Aquifer);
Aquifer.init.setup();

// APIs.
Aquifer.project = require('./lib/project.api.js')(Aquifer);

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
