/**
 * @file
 * Creates commands added by extensions.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  var _          = require('lodash'),
      extensions = {},
      extensionCommands, command, extension;

  // If there is no aquifer project, do not initialize extension commands.
  if (!Aquifer.initialized) {
    return;
  }

  /**
   * Create 'extensions' command that lists all installed extensions.
   */
  command = Aquifer.cli.command('extensions');
  command.description('List all installed extensions.');
  command.action(function () {

    // If there are no extensions installed, exit.
    if (Object.keys(Aquifer.project.config.extensions).length <= 0) {
      Aquifer.console.log('No extensions have been installed. Run "aquifer extension-add --help for more info.', 'warning');
      return;
    }

    var extension;
    _.each(Aquifer.project.config.extensions, function(config, name) {
      Aquifer.console.log(name, 'notice');
    });
  });

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

    // If there are no extensions installed, exit.
    if (Object.keys(Aquifer.project.config.extensions).length <= 0) {
      Aquifer.console.log('No extensions have been installed. Run "aquifer extension-add --help for more info.', 'warning');
      return;
    }

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
  });

  // At this point, if no extensions are installed, exit because
  // there are no external commands to be loaded.
  if (Object.keys(Aquifer.project.config.extensions).length <= 0) {
    return;
  }

  /**
   * Loop through and initialize all commands created by extensions.
   */
  _.each(Aquifer.project.config.extensions, function(config, extensionName) {
    // Require/load the extension module.
    extension = new Aquifer.api.extension(extensionName);
    extensions[extensionName] = extension.load();

    // If there is no '.commands()' function on this module, error out and exit.
    if (typeof extensions[extensionName].commands !== 'function') {
      Aquifer.console.log(extension.extensionName + ': Aquifer extension npm modules must return an object with an .commands() function', 'error');
      return;
    }

    // Retrieve extension info.
    extensionCommands = extensions[extensionName].commands();

    // Create commands from extension.
    _.each(extensionCommands, function (config, commandName) {
      command = Aquifer.cli.command(commandName);
      command.description(config.description);
      command.action(function () {
        extensions[extensionName].run(commandName);
      });
    });
  });
};
