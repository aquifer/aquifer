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
    var self      = this,
        exec      = require('child_process').exec,
        path      = require('path'),
        jsonFile  = require('jsonfile');

    // Scaffold extension properties.
    self.name = name || null;
    self.config = null;

    /**
     * Installs this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.install = function(callback) {
      // npm install extension.
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm install --save ' + self.name, function(err, stdout, stderr) {
        if (err) {
          Aquifer.console.log('Could not install ' + self.name + ': ' + err, 'error');
          return;
        }

        // Run setup.

        // Add to project json file.
        // Remove configuration from aquifer.json.
        var extensions = Aquifer.project.config.extensions;
        extensions[self.name] = {}
        Aquifer.project.updateJson({
          extensions: extensions
        });

        callback(false);
      });
    };

    /**
     * Uninstalls this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.uninstall = function(callback) {
      // npm cannot uninstall a local package by it's path :/.
      var uninstallName = self.name.indexOf('/') > -1 ? path.basename(self.name) : self.name;

      // npm install extension.
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + uninstallName, function(err, stdout, stderr) {
        if (err) {
          Aquifer.console.log('Could not uninstall ' + self.name + ': ' + err, 'error');
          return;
        }

        // Remove configuration from aquifer.json.
        var extensions = Aquifer.project.config.extensions;
        delete extensions[self.name];
        Aquifer.project.updateJson({
          extensions: extensions
        });

        callback(false);
      });
    };
  };

  return Extension;
}
