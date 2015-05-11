/**
 * @file
 * Defines 'aquifer build' cli.
 */


/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Define the 'create <name>' command.
   *
   * @param String directory directory in which aquifer should be initialized.
   */
  Aquifer.cli.command('build <build_name>')
  .description('Creates a Drupal site root in the builds directory.')
  .action(function (directory) {
    var path = require('path'),
        fs = require('fs-extra'),
        jsonFile = require('jsonfile'),
        jsonPath = path.join(Aquifer.cwd, 'aquifer.json'),
        make = '',
        json = {},
        project = {},
        build = {};

    // If the current directory doesn't contain an aquifer project, exit.
    if (!fs.existsSync(path.join(jsonPath))) {
      Aquifer.console.log('You are not currently in directory that contains an Aquifer project.', 'error');
      return;
    }

    // load json settings file.
    json = jsonFile.readFileSync(jsonPath);
    directory = path.join(Aquifer.cwd, json.paths.builds, directory),
    make = path.join(Aquifer.cwd, json.paths.make);
    project = new Aquifer.project(Aquifer.cwd, json.name);
    build = new Aquifer.build(project, directory);

    build.create(make, function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(self.name + ' build created successfully!', 'success');
      }
    });
  });
};
