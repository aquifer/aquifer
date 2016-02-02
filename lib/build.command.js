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
  .description('Construct the framework of the site using contents of custom modules, themes, and projects defined in Drush Make.')
  .option('-m, --make', 'Force a build from the make file. Lock file will not be rewritten.')
  .option('-r, --refresh-lock', 'Regenerate the lock file from the make file.')
  .option('-c, --copy', 'Copy directories instead of creating symlinks.')
  .option('-d, --directory <path>', 'The destination directory in which to build.')
  .action(function (options) {
    var path        = require('path'),
        settings    = Aquifer.project.config,
        makeFile    = path.join(Aquifer.projectDir, settings.paths.make),
        lockFile    = settings.paths.lock !== false ? path.join(Aquifer.projectDir, settings.paths.lock) : false,
        make        = options.make === true,
        refreshLock = lockFile !== false && options.refreshLock === true,
        copy        = options.copy === true,
        directory   = options.directory || settings.paths.build,
        build       = new Aquifer.api.build(directory, {
          symlink: !copy
        });

    build.create(make, refreshLock, makeFile, lockFile, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(settings.name + ' build created successfully!', 'success');
      }
    });
  });
};
