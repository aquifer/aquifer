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
  .action(function () {
    var path      = require('path'),
        jsonFile  = require('jsonfile'),
        jsonPath  = path.join(Aquifer.projectDir, 'aquifer.json'),
        make, json, build, directory;

    // load json settings file.
    json = jsonFile.readFileSync(jsonPath);
    directory = path.join(Aquifer.projectDir, json.paths.build);
    make = path.join(Aquifer.projectDir, json.paths.make);
    build = new Aquifer.api.build(directory);

    build.create(make, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(Aquifer.project.config.name + ' build created successfully!', 'success');
      }
    });
  });
};
