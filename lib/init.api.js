/**
 * @file
 * Defines initialization process.
 */

/* globals require, module, process */

module.exports = function (Aquifer) {
  'use strict';

  var fs    = require('fs-extra'),
      Init  = {},
      dir;

  /**
   * Sets up the aquifer object.
   *
   * @returns {boolean} true when Aquifer is finished initializing.
   */
  Init.setup = function() {
    Aquifer.version = '0.1.0';
    Aquifer.cli = require('commander');
    Aquifer.cwd = process.cwd();
    Aquifer.initialized = false;
    Aquifer.projectDir = false;

    // Traverse cwd, and find the aquifer project dir. If one does not exist
    // in the current path, the framework is not initialized.
    dir = Aquifer.cwd;
    while (Aquifer.projectDir === false && dir.length > 0) {
      if (fs.existsSync(dir + '/aquifer.json')) {
        Aquifer.project = new Aquifer.api.project(dir);
        Aquifer.initialized = true;
        Aquifer.projectDir = dir;
      }
      else {
        dir = dir.substring(0, dir.lastIndexOf('/'));
      }
    }

    // Set cli version, and usage details.
    Aquifer.cli
    .version(Aquifer.version)
    .usage('command [options]');

    // Set name.
    Aquifer.cli._name = 'aquifer';

    // Is this even a real thing if it doesn't have ascii art?
    Aquifer.art = [
      '                   _  __',
      '  __ _  __ _ _   _(_)/ _| ___ _ __',
      ' / _` |/ _` | | | | | |_ / _ \\ \'__|',
      '| (_| | (_| | |_| | |  _|  __/ |',
      ' \\__,_|\\__, |\\__,_|_|_|  \\___|_|',
      '          |_|'
    ].join('\n');

    return true;
  };

  return Init;
};
