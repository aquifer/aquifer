/**
 * @file
 * Defines an extension api for the aquifer cli.
 */

/* globals module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Define the extension api object.
   *
   * @param string name machine-friendly name of extension.
   */
  var Extension = function (name) {
    var self = this

    // Scaffold extension properties.
    self.name = name || null;
    self.config = null;
    self.installed = Aquifer.json.extensions.hasOwnProperty(name) ? true : false;

    // If self is installed, load configurations.
    if (self.installed) {
      self.config = Aquifer.json.extensions[name];
    }

    /**
     * Installs this extension.
     */
    self.install = function() {
      var exec = require('child_process').exec;

      // npm install extension.
      exec('npm install -g ' + self.name, function(err, stdout, stderr) {
        if (err) {
          Aquifer.console.log('Could not install ' + self.name + ': ' + err, 'error');
          return;
        }
      });
    };














    /**
     * Loads the extension modules and creates the commands.
     */
    self.load = function () {
      // If there is no aquifer project, or the extensions property
      // does not exist, then return and don't load anything.
      if (!Aquifer.initialized || !Aquifer.json.hasOwnProperty('extensions')) {
        return;
      }

      // Loop throuh the extensions specified in the project aquifer.json file
      // and load each module into the CLI.
      _.each(Aquifer.json.extensions, function(config, name) {
        extensions[name] = require(name)(Aquifer, config);

        // If there is no init function on this module, error out and exit.
        if (!extensions[name].hasOwnProperty('init')) {
          Aquifer.console.log('Aquifer extension npm modules must return an object with an .init() function', 'error');
          return;
        }

        // Retrieve extension info.
        extension = extensions[name].init();



      });
    };

    /**
     * Adds an extension module.
     * @param string name name of the extension that should be added.
     */
    self.add = function (name) {
      // If aquifer is not initialized, exit.
      if (!Aquifer.initialized || !Aquifer.json.hasOwnProperty('extensions')) {
        return;
      }
    };
  }

  return Extension;
}
