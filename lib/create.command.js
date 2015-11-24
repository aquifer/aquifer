/**
 * @file
 * Defines 'aquifer create' cli.
 */


/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Define the 'create <name>' command.
   *
   * @param String directory directory in which aquifer should be initialized.
   */
  Aquifer.cli.command('create <name>')
  .description('Creates a directory and initializes an aquifer Drupal project inside of it.')
  .option('-d, --drupal_version <major_version_number>', 'Optional Major Drupal version. Accepts 7 or 8, defaults to 7.')
  .option('-c, --config_file <path>', 'Optional path to an aquifer.json config file.')
  .action(function (name, options) {
    var path           = require('path'),
        configFile     = options.config_file ? options.config_file : false,
        drupalVersion  = options.drupal_version ? options.drupal_version : 7,
        directory      = path.join(Aquifer.cwd, name),
        project        = {};

    project = new Aquifer.api.project(directory, name, configFile, drupalVersion);
    project.create(function(error) {
      if (error) {
        Aquifer.console.log(error, 'error');
      }
      else {
        Aquifer.console.log(name + ' created successfully!', 'success');
      }
    });
  });
};
