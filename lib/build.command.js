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
  Aquifer.cli.command('build <output_dir>')
  .description('Creates a Drupal site root from an Aquifer project.')
  .action(function (directory) {
    var path = require('path'),
        fs = require('fs-extra'),
        jsonFile = require('jsonfile'),
        directory = path.join(Aquifer.cwd, directory),
        jsonPath = path.join(Aquifer.cwd, 'aquifer.json'),
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
    project = new Aquifer.project(Aquifer.cwd, json.name);
    build = new Aquifer.build(project, directory);

    build.create(function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(self.name + ' build created successfully!', 'success');
      }
    });
  });
};
