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
  .option('-l, --lock <file.lock>', 'Override the lock file defined in settings for the build or enter "false" to skip lock file and build from make file. Existing lock file will be preserved.')
  .option('-m, --make <file.make>', 'Override the make file defined in settings for the build. Lock file will be rewritten unless you also set --lock to "false".')
  .option('-r, --rebuild', 'Force rebuild from the make file and create a new lock file. Only relevant if using lock file options.')
  .action(function (options) {
    var path      = require('path'),
        jsonFile  = require('jsonfile'),
        jsonPath  = path.join(Aquifer.projectDir, 'aquifer.json'),
        settings  = jsonFile.readFileSync(jsonPath),
        lockFile  = options.lock ? options.lock : settings.paths.lock,
        makeFile  = options.make ? options.make : settings.paths.make,
        make, lock, rebuild, build, directory;

    directory = path.join(Aquifer.projectDir, settings.paths.builds, settings.paths.root);
    make = path.join(Aquifer.projectDir, makeFile);
    lock = lockFile && lockFile !== 'false' ? path.join(Aquifer.projectDir, lockFile) : false;
    // Inclusion of a make option should trigger rebuild behavior.
    rebuild  = (options.make || options.rebuild) ? true : false;
    build = new Aquifer.api.build(directory);

    build.create(make, lock, rebuild, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(Aquifer.project.config.name + ' build created successfully!', 'success');
      }
    });
  });
};
