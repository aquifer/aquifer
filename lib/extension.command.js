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

  // If there is no aquifer project, do not initialize extension commands.
  if (!Aquifer.initialized) {
    return;
  }

  /**
   * Create 'extension-add <name>' command that allows users to install extensions.
   *
   * @param string name machine name of npm module that should be installed.
   */
  command = Aquifer.cli.command('extension-add <name>');
  command.description('Install and configure an extension, and add it as a dependency to the project.');
  command.action(function(name) {
    var extension = new Aquifer.api.extension(name);
    extension.install(function (err) {
      if (err) {
        Aquifer.console.log(err, 'error');
      }
      else {
        Aquifer.console.log(name + ' successfully added!', 'success');
      }
    });
  });

  /**
   * Create 'extension-remove <name>' command that allows users to uninstall extensions.
   *
   * @param string name machine name of npm module that should be installed.
   */
  command = Aquifer.cli.command('extension-remove <name>');
  command.description('Remove extension and configurations from the project.');
  command.action(function(name) {
    var extension = new Aquifer.api.extension(name);
    extension.uninstall(function (err) {
      if (err) {
        Aquifer.console.log(err, 'error');
      }
      else {
        Aquifer.console.log(name + ' successfully removed!', 'success');
      }
    });
  });

  /**
   * Create 'extension-reload' command that allows users to reload/reinstall all extensions.
   *
   * @param string name machine name of npm module that should be installed.
   */
  command = Aquifer.cli.command('extension-load');
  command.description('Reload, and re-install all extensions. Does not run configuration prompts.');
  command.action(function(name) {
    var extension;
    _.each(Aquifer.project.config.extensions, function(config, name) {
      extension = new Aquifer.api.extension(name);
      extension.install(function (err) {
        if (err) {
          Aquifer.console.log(err, 'error');
        }
        else {
          Aquifer.console.log('Installed and configured ' + name, 'success');
        }
      });
    });

    Aquifer.console.log('Finished updating extensions.', 'success');
  });

  // Loop throuh the extensions specified in the project aquifer.json file
  // and load each module into the CLI.
  _.each(Aquifer.project.config.extensions, function(config, name) {
    // Require the extension module.
    extensions[name] = require(name)(Aquifer, config);

    // If there is no init function on this module, error out and exit.
    if (!extensions[name].hasOwnProperty('commands')) {
      Aquifer.console.log('Aquifer extension npm modules must return an object with an .commands() function', 'error');
      return;
    }

    // Retrieve extension info.
    extensionCommands = extensions[name].commands();

    // Create commands from extension.
    _.each(extensionCommands, function(config) {
      
    });
  });
};
