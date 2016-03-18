/**
 * @file
 * Creates commands added by extensions.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');

/**
 * Defines commands related to interacting with extensions.
 * @param {object} Aquifer active instance of Aquifer.
 * @returns {undefined} nothing.
 */
module.exports = function (Aquifer) {
  let extensions = {}, extensionCommands, command, extension;

  /**
   * Create 'extensions' command that lists all installed extensions.
   */
  command = Aquifer.cli.command('extensions');
  command.description('List all installed extensions.');
  command.action(() => {

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
  command.action((name, options) => {
    let extension = new Aquifer.api.extension(Aquifer, name, options.source);
    extension.install()
    .then(() => {
      Aquifer.console.log(name + ' successfully added! You can configure your extension by adding items to the "extensions": {} object in your aquifer.json file. See the documentation for ' + name + ' for more details.', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
  });

  /**
   * Create 'extension-remove <name>' command that allows users to uninstall extensions.
   *
   * @param string name machine name of npm module that should be installed.
   */
  command = Aquifer.cli.command('extension-remove <name>');
  command.description('Remove extension and configurations from the project.');
  command.action((name) => {
    if (!Aquifer.project.config.extensions[name]) {
      Aquifer.console.log('The ' + name + ' extension does not exist.', 'error');
      return;
    }

    let extension = new Aquifer.api.extension(Aquifer, name);
    extension.uninstall()
    .then(() => {
      Aquifer.console.log(name + ' successfully removed!', 'success');
    })
    .catch((reason) => {
      Aquifer.console.log(reason, 'error');
    })
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

    let extension;
    _.each(Aquifer.project.config.extensions, function(config, name) {
      // If this extension is false, exit.
      if (!config) {
        return;
      }

      extension = new Aquifer.api.extension(Aquifer, name);
      extension.download()
      .then(() => {
        Aquifer.console.log('Downloaded ' + name, 'success');
      })
      .catch((reason) => {
        Aquifer.console.log(reason, 'error');
      })
    })
  });

  // At this point, if no extensions are installed, exit because
  // there are no external commands to be loaded.
  if (Object.keys(Aquifer.project.config.extensions).length <= 0) {
    return;
  }

  /**
   * Loop through and initialize all commands created by extensions.
   */
  _.each(Aquifer.project.config.extensions, (config, extensionName) => {
    // Do not load if this extension is false.
    if (!config) {
      return;
    }

    // Require/load the extension module.
    extension = new Aquifer.api.extension(Aquifer, extensionName);
    extension.load()
    .then((extensionObject) => {
      // Add to extensions array.
      extensions[extensionName] = extensionObject;

      // Exit if there was an error loading the extension.
      if (!extensions[extensionName]) {
        Aquifer.console.log('There was an error loading the ' + extensionName + ' extension.', 'error');
        return;
      }

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
          })
        })
      })
    })
    .catch((reason) => {
      if (process.argv.slice(2)[0] !== 'extensions-load') {
        Aquifer.console.log(reason, 'warning');
      }
    })
  })
}
