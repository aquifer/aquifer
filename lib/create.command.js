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
  .action(function (name) {
    var path = require('path'),
        project = new Aquifer.project(path.join(Aquifer.cwd, name), name);

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
