/**
 * @file
 * Defines 'aquifer create' cli.
 */

'use strict';

/**
 * Defines the 'create' command
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {

  // Define the 'create <name>' command.
  Aquifer.cli.command('create <name>')
  .description('Creates a directory and initializes an aquifer Drupal project inside of it.')
  .option('-d, --drupal_version <major_version_number>', 'Optional Major Drupal version. Accepts 7 or 8, defaults to 8.')
  .option('-c, --config_file <path>', 'Optional path to an aquifer.json config file.')
  .action((name, options) => {
    let path = require('path');
    let configFile = options.config_file ? options.config_file : false;
    let drupalVersion  = options.drupal_version ? options.drupal_version : 8;
    let directory = path.join(Aquifer.cwd, name);
    let project = new Aquifer.api.project(Aquifer, drupalVersion);

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
