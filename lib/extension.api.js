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
   * @param string source extension source. This could be any value recognized by `npm install <source>`.
   */
  var Extension = function (name, source) {
    var self        = this,
        exec        = require('child_process').exec,
        path        = require('path'),
        fs          = require('fs');


    /**
     * Determines whether or not a path exists.
     *
     * @param string toCheck path for which this function will check for existence.
     *
     * @return Boolean true if path exists, false if else.
     */
    self.pathExists = function (toCheck) {
      try {
        fs.statSync(toCheck);
      }
      catch (err) {
        return false;
      }
      return true;
    };

    // Scaffold extension properties.
    self.name = name || null;
    self.path = path.join(Aquifer.projectDir, '.aquifer/node_modules/' + self.name);

    /**
     * Loads configuration and determines whether or not extension is installed.
     */
    self.loadConfig = function () {
      self.config = Aquifer.project.config.extensions.hasOwnProperty(self.name) ? Aquifer.project.config.extensions[self.name] : false;
      self.installed = self.config ? true : false;
      self.downloaded = self.pathExists(self.path) ? true : false;
    };

    self.loadConfig();

    // If this package is installed, load from config.
    if (self.installed) {
      self.source = self.config.source;
    }
    // If this package isn't installed, use passed in source prop. If no source
    // property exists, default to the name.
    // (npm install /path/module || npm install published-module).
    else {
      self.source = source || name;
    }

    // Use the source value to determine whether the extension is local.
    self.isLocal = self.pathExists(self.source);

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
        extensions[self.name] = {source: self.source};
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

      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm ' + command + ' --save ' + self.source, function(err, stdout, stderr) {
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
      exec('cd ' + path.join(Aquifer.project.directory, '.aquifer') + ' && npm uninstall --save ' + self.name, function(err, stdout, stderr) {
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
        callback('The ' + self.name + ' extension has not been downloaded. Please run "aquifer extensions-load".');
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
