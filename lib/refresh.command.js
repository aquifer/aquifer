/**
 * @file
 * Defines 'aquifer refresh' cli.
 */

'use strict';

/**
 * Defines the 'refresh' command
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {

  // Define the 'refresh' command.
  Aquifer.cli.command('refresh')
  .description('Executes post-build Drush commands defined in aquifer.json, such as apply database updates, clear cache, and so forth.')
  .option('-a, --drupalAlias <alias>', 'Optional alias for the target site.')
  .action(function (options) {
    let path = require('path');
    let target = options.drupalAlias ? options.drupalAlias : Aquifer.project.config.paths.build;
    let name = options.drupalAlias ? options.drupalAlias : Aquifer.project.config.name;
    let refresh = new Aquifer.api.refresh(Aquifer);

    refresh.execute(target)
    .then(() => {
      Aquifer.console.log('All refresh commands run for ' + name, 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(error, 'error');
    })
  })
}
