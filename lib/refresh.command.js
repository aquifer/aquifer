/**
 * @file
 * Defines 'aquifer refresh' cli.
 */


/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  // If the current directory doesn't contain an aquifer project, exit.
  if (!Aquifer.initialized) {
    return;
  }

  /**
   * Define the 'refresh' command.
   */
  Aquifer.cli.command('refresh')
  .description('Refreshes a site against the current state of its codebase.')
  .option('-a, --drupalAlias <alias>', 'Optional alias for the target site.')
  .action(function (options) {
    var path      = require('path'),
        target    = options.drupalAlias ? options.drupalAlias : path.join(Aquifer.projectDir, Aquifer.project.config.paths.builds, Aquifer.project.config.paths.root),
        name      = options.drupalAlias ? options.drupalAlias : Aquifer.project.config.name;

    Aquifer.api.refresh(target, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log('All refresh commands run for ' + name, 'success');
      }
    });
  });
};
