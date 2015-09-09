/**
 * @file
 * Defines 'aquifer build' cli.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  // If the current directory doesn't contain an aquifer project, exit.
  if (!Aquifer.initialized) {
    return;
  }

  /**
   * Define the 'build' command.
   */
  Aquifer.cli.command('build')
  .description('Builds a Drupal site in the /builds/work directory.')
  .option('-m, --make', 'Force a build from the make file. Lock file will not be rewritten.')
  .option('-r, --reset-lock', 'Regenerate the lock file from the make file.')
  .action(function (options) {
    var path      = require('path'),
        jsonFile  = require('jsonfile'),
        jsonPath  = path.join(Aquifer.projectDir, 'aquifer.json'),
        settings  = jsonFile.readFileSync(jsonPath),
        makeFile  = path.join(Aquifer.projectDir, settings.paths.make),
        lockFile  = settings.paths.lock !== false ? path.join(Aquifer.projectDir, settings.paths.lock) : false,
        make      = options.make === true,
        resetLock = lockFile !== false && options.resetLock === true,
        directory = path.join(Aquifer.projectDir, settings.paths.build),
        build     = new Aquifer.api.build(directory);

    build.create(make, resetLock, makeFile, lockFile, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(Aquifer.project.config.name + ' build created successfully!', 'success');
      }
    });
  });
};
