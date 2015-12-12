/**
 * @file
 * Creates commands added by extensions.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  var _          = require('lodash'),
      extensions = {},
      extensionCommands, command, extension,
      extensionPostBuilds, postBuild;

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

    // Loop through extensions, and log.
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
  command.option('-s, --source <source>', 'The package source as recognized by the `npm install` command. By default this is the same as the extension name.');
  command.action(function(name, options) {
    var extension = new Aquifer.api.extension(name, options.source);
    extension.install(function (err) {
      if (err) {
        Aquifer.console.log(err, 'error');
      }
      else {
        Aquifer.console.log(name + ' successfully added! You can configure your extension by adding items to the "extensions": {} object in your aquifer.json file. See the documentation for ' + name + ' for more details.', 'success');
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
    if (!Aquifer.project.config.extensions[name]) {
      Aquifer.console.log('The ' + name + ' extension does not exist.', 'error');
      return;
    }

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
   * Create 'extensions-load' command that allows users to reload/reinstall all extensions.
   *
   * @param string name machine name of npm module that should be installed.
   */
  command = Aquifer.cli.command('extensions-load');
  command.description('Re-loads all installed extensions.');
  command.action(function(name) {

    // If there are no extensions installed, exit.
    if (Object.keys(Aquifer.project.config.extensions).length <= 0) {
      Aquifer.console.log('No extensions have been installed. Run "aquifer extension-add --help for more info.', 'warning');
      return;
    }

    var extension;
    _.each(Aquifer.project.config.extensions, function(config, name) {
      extension = new Aquifer.api.extension(name);
      extension.download(function (err) {
        if (err) {
          Aquifer.console.log(err, 'error');
        }
        else {
          Aquifer.console.log('Downloaded ' + name, 'success');
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
    extensions[extensionName] = extension.load(function (err) {
      if (err) {
        Aquifer.console.log(err, 'error');
      }
    });

    // Exit if there was an error loading the extension.
    if (!extensions[extensionName]) {
      Aquifer.console.log('There was an error loading the ' + extensionName + ' extension.', 'error');
      return;
    }


    if (typeof extensions[extensionName].commands !== 'function' && typeof extensions[extensionName].postBuild !== 'function') {
      Aquifer.console.log(extension.extensionName + ': Aquifer extension npm modules must return an object with either a .commands() or .postBuild() function.', 'error');
      return;
    }

    // If there is a '.commands()' function, create its commands.
    if (typeof extensions[extensionName].commands == 'function') {
      // Retrieve extension info.
      extensionCommands = extensions[extensionName].commands();

      // Create commands from extension.
      _.each(extensionCommands, function (config, commandName) {
        command = Aquifer.cli.command(commandName);
        command.description(config.description);

        if (config.options) {
          _.each(config.options, function (option) {
            command.option(option.name, option.description, option.default || null);
          });
        }

        if (config.allowUnknownOption) {
          command.allowUnknownOption();
        }

        command.action(function (options) {
          options = options || {};

          extensions[extensionName].run(commandName, options, function (err) {
            if (err) {
              Aquifer.console.log(err, 'error');
            }
          });
        });
      });
    }

    // If there is a '.postBuild()' function on this module, add it.
    if (typeof extensions[extensionName].postBuild == 'function') {
      Aquifer.postBuilds.push(extensions[extensionName].postBuild);
    }
  });
};
