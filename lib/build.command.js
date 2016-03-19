/**
 * @file
 * Defines 'aquifer build' cli.
 */

'use strict';

/**
 * Defines the 'build' command
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {

  // Define the 'build' command.
  Aquifer.cli.command('build')
  .description('Construct the framework of the site using contents of custom modules, themes, and projects defined in Drush Make.')
  .option('-c, --copy', 'Copy directories instead of creating symlinks.')
  .option('-d, --directory <path>', 'The destination directory in which to build.')
  .action((options) => {
    let path = require('path');
    let settings = Aquifer.project.config;
    let makeFile = path.join(Aquifer.projectDir, settings.paths.make);
    let copy = options.copy === true;
    let directory = options.directory || settings.paths.build;
    let build = new Aquifer.api.build(Aquifer);

    // Create build.
    build.create(directory, {
      symlink: !copy,
      makeFile: makeFile
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
    .then(() => {
      Aquifer.console.log(settings.name + ' build created successfully!', 'success');
    })
  })
}
