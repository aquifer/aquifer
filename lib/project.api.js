/**
 * @file
 * This file defines the data model for a Aquifer project.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Defines the Project object.
   *
   * @param string directory working directory of project.
   * @param string name name of project;
   */
  var Project = function(directory, name) {
    var self = this,
        fs = require('fs-extra'),
        path = require('path'),
        jsonFile = require('jsonfile'),
        _ = require('lodash');


    self.directory = directory;
    self.name = name;

    // Define relative paths to assets.
    self.relativePaths = {
      json: 'aquifer.json',
      make: 'drupal.make',
      settings: 'site.settings.php',
      builds: 'builds/',
      modules: 'modules/',
      themes: 'themes/',
    };

    // Define absolute paths to assets.
    self.absolutePaths = {
      json: path.join(self.directory, self.relativePaths.json),
      make: path.join(self.directory, self.relativePaths.make),
      settings: path.join(self.directory, self.relativePaths.settings),
      builds: path.join(self.directory, self.relativePaths.builds),
      modules: path.join(self.directory, self.relativePaths.modules),
      themes: path.join(self.directory, self.relativePaths.themes)
    };

    // Determine whether or not this project is initialized.
    self.initialized = fs.existsSync(self.directory) && fs.existsSync(self.absolutePaths.json) ? true : false;

    /**
     * Creates and scaffolds this project as defined.
     *
     * @param function callback called when an error occurs or when
     *                          the function completes execution.
     */
    self.create = function(callback) {
      if (self.initialized === true) {
        callback(self.directory + ' already exists, or is already an aquifer project.');
        return;
      }

      var srcDir = path.join(path.dirname(fs.realpathSync(__filename)), '../src');
      fs.mkdirSync(self.directory);
      fs.mkdirSync(self.absolutePaths.builds);
      fs.mkdirSync(self.absolutePaths.modules);
      fs.mkdirSync(self.absolutePaths.themes);
      fs.copySync(path.join(srcDir, 'site.settings.php'), self.absolutePaths.settings);
      fs.copySync(path.join(srcDir, 'drupal.make'), self.absolutePaths.make);

      // Create aquifer.json file.
      var aquiferJson = {
        name: self.name,
        paths: self.relativePaths
      };

      jsonFile.writeFileSync(self.absolutePaths.json, aquiferJson);
    };
  }

  return Project;
};
