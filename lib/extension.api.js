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

    /**
     * Installs this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.install = function(callback) {
      var exec = require('child_process').exec,
          path = require('path'),
          jsonFile  = require('jsonfile');

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
        extensions[name] = {}
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
      var exec = require('child_process').exec,
          path = require('path'),
          jsonFile  = require('jsonfile');

      // npm install extension.
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + self.name, function(err, stdout, stderr) {
        if (err) {
          Aquifer.console.log('Could not uninstall ' + self.name + ': ' + err, 'error');
          return;
        }

        // Remove configuration from aquifer.json.
        var extensions = Aquifer.project.config.extensions;
        delete extensions[name];
        Aquifer.project.updateJson({
          extensions: extensions
        });

        callback(false);
      });
    };
  };

  return Extension;
}
