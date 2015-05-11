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
  var Project = function(directory, name) {
    var self = this,
        fs = require('fs-extra'),
        path = require('path'),
        touch = require('touch'),
        jsonFile = require('jsonfile'),
        jsonPath = path.join(directory, 'aquifer.json');


    // Set directory, name, and status.
    self.directory = directory;
    self.name = name;
    self.initialized = fs.existsSync(self.directory) || fs.existsSync(jsonPath) ? true : false;

    // If this project already exists, then read aquifer json to define relative paths.
    if (self.initialized) {
      self.json = jsonFile.readFileSync(jsonPath);
      self.relativePaths = self.json.paths;
    }

    // If this is a new project, then define paths manually.
    else {
      self.json = false;
      self.relativePaths = {
        make: 'drupal.make',
        settings: 'site.settings.php',
        builds: 'builds/',
        themes: {
          root: 'themes/',
          contrib: 'themes/contrib'
        },
        modules: {
          root: 'modules',
          contrib: 'modules/contrib',
          custom: 'modules/custom',
          features: 'modules/features'
        }
      };
    };

    // Define absolute paths to assets.
    self.absolutePaths = {
      make: path.join(self.directory, self.relativePaths.make),
      settings: path.join(self.directory, self.relativePaths.settings),
      builds: path.join(self.directory, self.relativePaths.builds),
      themes: {
        root: path.join(self.directory, self.relativePaths.themes.root),
        contrib: path.join(self.directory, self.relativePaths.themes.contrib)
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

      var srcDir = path.join(path.dirname(fs.realpathSync(__filename)), '../src');

      // Create root, modules, builds, and themes folders.
      fs.mkdirSync(self.directory);
      fs.mkdirSync(self.absolutePaths.builds);
      fs.mkdirSync(self.absolutePaths.themes.root);
      fs.mkdirSync(self.absolutePaths.themes.contrib);
      fs.mkdirSync(self.absolutePaths.modules.root);
      fs.mkdirSync(self.absolutePaths.modules.contrib);
      fs.mkdirSync(self.absolutePaths.modules.custom);
      fs.mkdirSync(self.absolutePaths.modules.features);

      // .gitkeeps in module, theme, and build folders
      touch.sync(path.join(self.absolutePaths.modules.custom, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.modules.contrib, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.modules.features, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.root, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.contrib, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.builds, '.gitkeep'));

      // Copy over src files.
      fs.copySync(path.join(srcDir, 'site.settings.php'), self.absolutePaths.settings);
      fs.copySync(path.join(srcDir, 'drupal.make'), self.absolutePaths.make);
      fs.copySync(path.join(srcDir, 'gitignore'), path.join(self.directory, '.gitignore'));

      // Create aquifer.json file.
      var aquiferJson = {
        name: self.name,
        paths: self.relativePaths
      };

      jsonFile.writeFileSync(self.absolutePaths.json, aquiferJson);

      callback(false);
    };
  };

  return Project;
};
