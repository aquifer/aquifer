/**
 * @file
 * This file defines the data model for a Aquifer project.
 */

/* globals require, module, __filename */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Defines the Project object.
   *
   * @param string directory working directory of project.
   * @param string name name of project;
   */
  var Project = function(directory, name, configJsonPath) {
    var self      = this,
        fs        = require('fs-extra'),
        path      = require('path'),
        touch     = require('touch'),
        jsonFile  = require('jsonfile'),
        jsonPath  = path.join(directory, 'aquifer.json');


    // Set directory, name, and status.
    self.directory = directory;
    self.name = name;

    // Decide whether or not this is initialized already.
    self.initialized = fs.existsSync(self.directory) || fs.existsSync(jsonPath) ? true : false;

    // Set default relative paths.
    self.relativePaths = {
      make: 'drupal.make',
      settings: 'settings',
      builds: 'builds/',
      themes: {
        root: 'themes/',
        contrib: 'themes/contrib',
        custom: 'themes/custom'
      },
      modules: {
        root: 'modules',
        contrib: 'modules/contrib',
        custom: 'modules/custom',
        features: 'modules/features'
      }
    };

    // If this project already exists, then read aquifer json to define relative paths.
    if (self.initialized) {
      self.json = jsonFile.readFileSync(jsonPath);
      self.relativePaths = self.json.paths;
    }
    // If a config json file was passed in, use it to set paths.
    else {
      if (configJsonPath) {
        self.json = jsonFile.readFileSync(configJsonPath);
        self.relativePaths = self.json.paths;
      }
    }

    // Define absolute paths to assets.
    self.absolutePaths = {
      json: jsonPath,
      make: path.join(self.directory, self.relativePaths.make),
      settings: path.join(self.directory, self.relativePaths.settings),
      builds: path.join(self.directory, self.relativePaths.builds),
      themes: {
        root: path.join(self.directory, self.relativePaths.themes.root),
        contrib: path.join(self.directory, self.relativePaths.themes.contrib),
        custom: path.join(self.directory, self.relativePaths.themes.custom)
      },
      modules: {
        root: path.join(self.directory, self.relativePaths.modules.root),
        contrib: path.join(self.directory, self.relativePaths.modules.contrib),
        custom: path.join(self.directory, self.relativePaths.modules.custom),
        features: path.join(self.directory, self.relativePaths.modules.features)
      }
    };


    /**
     * Creates and scaffolds this project as defined.
     *
     * @param function callback called when an error occurs or when the function completes execution.
     */
    self.create = function(callback) {
      if (self.initialized === true) {
        callback(self.directory + ' already exists, or is already an aquifer project.');
        return;
      }

      var srcDir      = path.join(path.dirname(fs.realpathSync(__filename)), '../src'),
          aquiferJson = {
            name: self.name,
            paths: self.relativePaths
          };

      // Create root, modules, builds, and themes folders.
      fs.mkdirSync(self.directory);
      fs.mkdirSync(self.absolutePaths.builds);
      fs.mkdirSync(self.absolutePaths.settings);
      fs.mkdirSync(self.absolutePaths.themes.root);
      fs.mkdirSync(self.absolutePaths.themes.custom);
      fs.mkdirSync(self.absolutePaths.modules.root);
      fs.mkdirSync(self.absolutePaths.modules.custom);
      fs.mkdirSync(self.absolutePaths.modules.features);

      // .gitkeeps in module, theme, and build folders
      touch.sync(path.join(self.absolutePaths.modules.custom, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.modules.features, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.root, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.custom, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.builds, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.settings, '.gitkeep'));

      // Copy over src files.
      fs.copySync(path.join(srcDir, 'site.settings.php'), path.join(self.absolutePaths.settings, 'site.settings.php'));
      fs.copySync(path.join(srcDir, 'drupal.make'), self.absolutePaths.make);
      fs.copySync(path.join(srcDir, 'gitignore'), path.join(self.directory, '.gitignore'));

      // Create aquifer.json file.
      jsonFile.writeFileSync(self.absolutePaths.json, aquiferJson);

      callback(false);
    };
  };

  return Project;
};
