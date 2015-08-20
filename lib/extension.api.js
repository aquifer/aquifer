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
        fs        = require('fs');

    // Scaffold extension properties.
    self.name = name || null;
    self.isLocal = self.name.indexOf('/') <= -1 ? false : true;
    self.localName = self.isLocal ? path.basename(self.name) : self.name;
    self.path = path.join(Aquifer.projectDir, '.aquifer/node_modules/' + self.localName);

    /**
     * Loads configuration and determines whether or not extension is installed.
     */
    self.loadConfig = function () {
      self.config = Aquifer.project.config.extensions.hasOwnProperty(self.name) ? Aquifer.project.config.extensions[self.name] : false;
      self.installed = self.config ? true : false;
      self.downloaded = fs.existsSync(self.path) ? true : false;
    };

    self.loadConfig();

    /**
     * Installs this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.install = function (callback) {
      // Callback defaults to empty.
      callback = callback || function () {};

      // npm install extension.
      self.download(function (err) {
        if (err) {
          callback(err);
          return;
        }

        // Add to project json file.
        // Remove configuration from aquifer.json.
        var extensions = Aquifer.project.config.extensions;
        extensions[self.name] = {};
        Aquifer.project.updateJson({
          extensions: extensions
        });

        // Re-load configs.
        self.loadConfig();

        callback(false);
      });
    };

    /**
     * Installs this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.download = function (callback) {
      // Set command to link if local.
      var command = self.isLocal ? 'link' : 'install';

      // Callback defaults to empty.
      callback = callback || function () {};

      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm ' + command + ' --save ' + self.name, function(err, stdout, stderr) {
        if (err) {
          callback('Could not download ' + self.name + ': ' + err);
          return;
        }
        callback(false);
      });
    };

    /**
     * Uninstalls this extension.
     *
     * @param function callback function that is called to return a message.
     */
    self.uninstall = function(callback) {
      // Callback defaults to empty.
      callback = callback || function () {};

      // npm install extension.
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + self.localName, function(err, stdout, stderr) {
        if (err) {
          callback('Could not uninstall ' + self.name + ': ' + err);
          return;
        }

        // Remove configuration from aquifer.json.
        var extensions = Aquifer.project.config.extensions;
        delete extensions[self.name];
        Aquifer.project.updateJson({
          extensions: extensions
        });

        // Re-load configs.
        self.loadConfig();

        callback(false);
      });
    };

    /**
     * Loads and returns an extension npm module.
     *
     * @param function callback function that will be called with there is a message to send.
     */
    self.load = function (callback) {
      // Callback defaults to empty.
      callback = callback || function () {};

      // If the extension is installed but not downloaded,
      // tell the user to reload the extensions.
      if (self.installed && !self.downloaded) {
        callback('Some installed extensions have not been downloaded. Please run "aquifer extensions-load".');
        return;
      }

      // If the extension is not installed or downloaded, exit.
      if (!self.installed && !self.downloaded) {
        callback('Cannot load extension ' + self.name + ', it is not installed or configured.');
        return;
      }

      return require(self.path)(Aquifer, self.config) || false;
    };
  };

  return Extension;
};
