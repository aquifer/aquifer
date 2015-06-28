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
    self.installed = Aquifer.project.config.extensions.hasOwnProperty(name) ? true : false;

    // If self is installed, load configurations.
    if (self.installed) {
      self.config = Aquifer.project.config.extensions[name];
    }

    /**
     * Installs this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.install = function(callback) {
      var exec = require('child_process').exec,
          jsonFile  = require('jsonfile');

      if (self.install) {
        callback(name + ' is already installed');
        return;
      }

      // npm install extension.
      exec('npm install -g ' + self.name, function(err, stdout, stderr) {
        if (err) {
          Aquifer.console.log('Could not install ' + self.name + ': ' + err, 'error');
          return;
        }

        // Run setup.

        // Add to project json file.
        Aquifer.project.updateJson({
          testingMeForSure: 'yay'
        });
      });
    };
  };

  return Extension;
}
