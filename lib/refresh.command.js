/**
 * @file
 * Defines 'aquifer refresh' cli.
 */


/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Define the 'refresh' command.
   */
  Aquifer.cli.command('refresh')
  .description('Refreshes a site against the current state of its codebase.')
  .option('-a, --drupalAlias <alias>', 'Optional alias for the target site.')
  .action(function (options) {
    // If the current directory doesn't contain an aquifer project, exit.
    if (!Aquifer.initialized) {
      Aquifer.console.log('You are not currently in directory that contains an Aquifer project.', 'error');
      return;
    }

    var path      = require('path'),
        jsonFile  = require('jsonfile'),
        jsonPath  = path.join(Aquifer.projectDir, 'aquifer.json'),
        json      = jsonFile.readFileSync(jsonPath),
        project   = new Aquifer.project(Aquifer.projectDir, json.name),
        target    = options.drupalAlias ? options.drupalAlias : path.join(Aquifer.projectDir, json.paths.builds, 'work'),
        name      = options.drupalAlias ? options.drupalAlias : project.name;

    Aquifer.refresh(target, json.refreshCommands, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log('All refresh commands run for ' + name, 'success');
      }
    });
  });
};
