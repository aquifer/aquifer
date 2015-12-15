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
   * @param {string} directory working directory of project.
   * @param {string} name name of project.
   * @param {string} configJsonPath path to json file that should extend default aquifer.json.
   *
   * @returns {object} instance of the Project object.
   */
  var Project = function(directory, name, configJsonPath) {
    var self          = this,
        _             = require('lodash'),
        fs            = require('fs-extra'),
        path          = require('path'),
        touch         = require('touch'),
        jsonFile      = require('jsonfile'),
        jsonPath      = path.join(directory, 'aquifer.json'),
        localJsonPath = path.join(directory, 'aquifer.local.json'),
        srcDir        = path.join(path.dirname(fs.realpathSync(__filename)), '../src');

    // Set directory, name, and status. Directory is required!
    self.directory = directory || Aquifer.cwd;

    // Decide whether or not this is initialized already.
    self.initialized = fs.existsSync(self.directory) || fs.existsSync(jsonPath) ? true : false;

    // If this project is initialized, load the JSON path.
    if (self.initialized) {
      self.config = jsonFile.readFileSync(jsonPath);

      // Extend config with aquifer.local.json.
      if (fs.existsSync(localJsonPath)) {
        self.config = _.defaultsDeep(jsonFile.readFileSync(localJsonPath), self.config);
      }
    }
    // If this is a new (uninitialized) project, load the default json.
    else {
      self.config = jsonFile.readFileSync(path.join(srcDir, 'aquifer.default.json'));
    }

    // If a config json path was passed in, extend the default.
    if (configJsonPath) {
      var configJson = jsonFile.readFileSync(configJsonPath);
      _.merge(self.config, configJson);
    }

    // Set name, default to basename of directory.
    if (!self.config.name || self.config.name.length <= 0) {
      self.config.name = name || path.basename(directory);
    }

    // Define absolute paths to assets.
    self.absolutePaths = {
      json: jsonPath,
      make: path.join(self.directory, self.config.paths.make),
      settings: path.join(self.directory, self.config.paths.settings),
      root: path.join(self.directory, self.config.paths.root),
      drush: path.join(self.directory, self.config.paths.drush),
      build: path.join(self.directory, self.config.paths.build),
      themes: {
        root: path.join(self.directory, self.config.paths.themes.root),
        contrib: path.join(self.directory, self.config.paths.themes.contrib),
        custom: path.join(self.directory, self.config.paths.themes.custom)
      },
      modules: {
        root: path.join(self.directory, self.config.paths.modules.root),
        contrib: path.join(self.directory, self.config.paths.modules.contrib),
        custom: path.join(self.directory, self.config.paths.modules.custom),
        features: path.join(self.directory, self.config.paths.modules.features)
      },
      files: {
        root: path.join(self.directory, self.config.paths.files.root)
      }
    };

    // Make sure build absolute path is correct.
    if (path.resolve(self.config.paths.build) === self.config.paths.build) {
      self.absolutePaths.build = self.config.paths.build;
    }

    /**
     * Creates and scaffolds this project as defined.
     *
     * @param {function} callback called when an error occurs or when the function completes execution.
     *
     * @returns {boolean} false if this project is already initialized, true if create completes.
     */
    self.create = function(callback) {
      if (self.initialized === true) {
        callback(self.directory + ' already exists, or is already an aquifer project.');
        return false;
      }

      // Create root, modules, builds, themes, and files folders.
      fs.mkdirSync(self.directory);
      fs.mkdirSync(self.absolutePaths.build);
      fs.mkdirSync(self.absolutePaths.settings);
      fs.mkdirSync(self.absolutePaths.root);
      fs.mkdirSync(self.absolutePaths.drush);
      fs.mkdirSync(self.absolutePaths.themes.root);
      fs.mkdirSync(self.absolutePaths.themes.custom);
      fs.mkdirSync(self.absolutePaths.modules.root);
      fs.mkdirSync(self.absolutePaths.modules.custom);
      fs.mkdirSync(self.absolutePaths.modules.features);
      fs.mkdirSync(self.absolutePaths.files.root);
      fs.mkdirSync(path.join(self.directory, '.aquifer'));

      // .gitkeeps in module, theme, and build folders
      touch.sync(path.join(self.absolutePaths.modules.custom, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.modules.features, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.root, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.themes.custom, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.build, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.settings, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.root, '.gitkeep'));
      touch.sync(path.join(self.absolutePaths.files.root, '.gitkeep'));

      // Copy over src files.
      fs.copySync(path.join(srcDir, 'default.settings.php'), path.join(self.absolutePaths.settings, 'settings.php'));
      fs.copySync(path.join(srcDir, 'default.secret.settings.php'), path.join(self.absolutePaths.settings, 'secret.settings.php'));
      fs.copySync(path.join(srcDir, 'default.local.settings.php'), path.join(self.absolutePaths.settings, 'local.settings.php'));
      fs.copySync(path.join(srcDir, 'drupal.make.yml'), self.absolutePaths.make);
      fs.copySync(path.join(srcDir, 'drushrc.php'), path.join(self.absolutePaths.drush, 'drushrc.php'));
      fs.copySync(path.join(srcDir, 'editorconfig'), path.join(self.directory, '.editorconfig'));
      fs.copySync(path.join(srcDir, 'gitignore'), path.join(self.directory, '.gitignore'));
      fs.copySync(path.join(srcDir, 'package.json'), path.join(self.directory, '.aquifer/package.json'));
      fs.copySync(path.join(srcDir, 'root.htaccess'), path.join(self.absolutePaths.root, '.htaccess'));
      fs.copySync(path.join(srcDir, 'robots.txt'), path.join(self.absolutePaths.root, 'robots.txt'));
      fs.copySync(path.join(srcDir, 'files.htaccess'), path.join(self.absolutePaths.files.root, '.htaccess'));

      // Create aquifer.json file.
      jsonFile.writeFileSync(self.absolutePaths.json, self.config);

      callback(false);
      return true;
    };

    /**
     * Updates the project json with a new object.
     *
     * @param {object} updateJson json that should be merged with project json.
     *
     * @returns {boolean} true if the update works correctly.
     */
    self.updateJson = function (updateJson) {
      if (updateJson) {
        self.config = _.extend(self.config, updateJson);
        jsonFile.writeFileSync(self.absolutePaths.json, self.config);
      }

      return true;
    };

    return self;
  };


  return Project;
};
