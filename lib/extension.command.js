/**
 * @file
 * Creates commands added by extensions.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  var _          = require('lodash'),
      extensions = {},
      extensionCommands, command;

  // If there is no aquifer project, or the extensions property
  // does not exist, then return and don't load anything.
  if (!Aquifer.initialized || !Aquifer.project.config.hasOwnProperty('extensions')) {
    return;
  }

  // Create 'aquifer extension-add' command.
  command = Aquifer.cli.command('extension-add <name>');
  command.description('Allows one to add extensions (such as deployment options) to their aquifer project. These extensions are npm modules that consume the Aquifer API.');
  command.action(function(name) {
    var extension = new Aquifer.api.extension(name);
    extension.install(function(err) {
      if (err) {
        Aquifer.console.log(err, 'error');
      }
      else {
        Aquifer.console.log(name + ' successfully installed!', 'success');
      }
    });
  });

  // Loop throuh the extensions specified in the project aquifer.json file
  // and load each module into the CLI.
  _.each(Aquifer.project.config.extensions, function(config, name) {
    // Require the extension module.
    extensions[name] = require(name)(Aquifer, config);

    // If there is no init function on this module, error out and exit.
    if (!extensions[name].hasOwnProperty('init')) {
      Aquifer.console.log('Aquifer extension npm modules must return an object with an .init() function', 'error');
      return;
    }

    // Retrieve extension info.
    extensionCommands = extensions[name].init();

    // Create commands from extension.
    _.each(extensionCommands, function(config) {

    });
  });
};
