/**
 * @file
 * Defines 'aquifer build' cli.
 */


/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Define the 'build' command.
   */
  Aquifer.cli.command('build')
  .description('Builds a Drupal site in the /builds/work directory.')
  .action(function () {
    var path = require('path'),
        fs = require('fs-extra'),
        jsonFile = require('jsonfile'),
        jsonPath = path.join(Aquifer.projectDir, 'aquifer.json'),
        make, json, project, build, directory;

    // If the current directory doesn't contain an aquifer project, exit.
    if (!Aquifer.initialized) {
      Aquifer.console.log('You are not currently in directory that contains an Aquifer project.', 'error');
      return;
    }

    // load json settings file.
    json = jsonFile.readFileSync(jsonPath);
    directory = path.join(Aquifer.projectDir, json.paths.builds, 'work');
    make = path.join(Aquifer.projectDir, json.paths.make);
    project = new Aquifer.project(Aquifer.projectDir, json.name);
    build = new Aquifer.build(project, directory);

    build.create(make, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(project.name + ' build created successfully!', 'success');
      }
    });
  });
};
