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
  .description('Executes post-build Drush commands defined in aquifer.json, such as apply database updates, clear cache, and so forth.')
  .option('-a, --drupalAlias <alias>', 'Optional alias for the target site.')
  .action(function (options) {
    var path      = require('path'),
        target    = options.drupalAlias ? options.drupalAlias : Aquifer.project.config.paths.build,
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
