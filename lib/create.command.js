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
  .option('-c, --config_file <path>', 'Optional path to an aquifer.json config file.')
  .action(function (name, options) {
    var path        = require('path'),
        configFile  = options.config_file ? options.config_file : false,
        directory   = path.join(Aquifer.cwd, name),

    project = new Aquifer.api.project(directory, name, configFile);
    project = new Aquifer.api.project(Aquifer);
    project.initialize(directory, name, configFile)
    .then(project.create.bind(project))
    .then(() => {
      Aquifer.console.log(name + ' created successfully!', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    });
  });
};
