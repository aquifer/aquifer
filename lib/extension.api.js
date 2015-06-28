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
        path      = require('path');

    // Scaffold extension properties.
    self.name = name || null;
    self.config = Aquifer.project.config.extensions.hasOwnProperty(self.name) ? Aquifer.project.config.extensions : false;
    self.installed = self.config ? true : false;
    self.isLocal = self.name.indexOf('/') <= -1 ? false : true;
    self.localName = self.isLocal ? path.basename(self.name) : self.name;

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
        extensions[self.name] = {};
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
      // npm install extension.
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + self.localName, function(err, stdout, stderr) {
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

    /**
     * Loads and returns an extension npm module.
     *
     * @param function callback function that will be called with there is a message to send.
     */
    self.load = function (callback) {
      if (!self.installed) {
        callback('Cannot load extension module ' + self.name + ', it is not installed or configured.');
        return;
      }

      return require(path.join(Aquifer.projectDir, '.aquifer/node_modules/' + self.localName))(Aquifer, self.config) || false;
    };
  };

  return Extension;
};
