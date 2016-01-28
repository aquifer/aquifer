/**
 * @file
 * Contains the project API for Aquifer.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const touch = require('touch');
const jsonFile = require('jsonfile');

/**
 * Constructs project API for Aquifer.
 *
 * @class
 * @classdesc Contains project API for Aquifer.
 */
class Project {

  /**
   * Scaffolds class properties.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    // Scaffold class properties.
    this.aquifer = Aquifer;
    this.config = {};
    this.paths = {};
    this.absolutePaths = {};
    this.srcDir = path.join(path.dirname(fs.realpathSync(__filename)), '../src');

    // If this Aquifer project has already been created, load it.
    if (Aquifer.initialized) {
      this.initialize(Aquifer.projectDir)
      .catch((reason) => {
        Aquifer.console.log(reason, 'error');
      });
    }
  }

  /**
   * Initializes a currently existing or new project.
   * @param {string} directory working directory of project.
   * @param {string} name name of project.
   * @param {string} configJsonPath path to json file that should extend default aquifer.json.
   * @returns {object} promise object.
   */
  initialize(directory, name, configJsonPath) {
    return new Promise((resolve, reject) => {
      // Calculate paths to json, and source directory.
      let jsonPath = path.join(directory, 'aquifer.json');
      let localJsonPath = path.join(directory, 'aquifer.local.json');

      // Default directory to Aquifer.projectDir.
      this.directory = directory = directory || Aquifer.projectDir;

      // If this project is initialized, load the JSON path.
      if (this.aquifer.initialized) {
        this.config = jsonFile.readFileSync(jsonPath);

        // Extend config with aquifer.local.json.
        if (fs.existsSync(localJsonPath)) {
          this.config = _.defaultsDeep(jsonFile.readFileSync(localJsonPath), this.config);
        }
      }

      // If this is a new (uninitialized) project, load the default json.
      else {
        this.config = jsonFile.readFileSync(path.join(this.srcDir, 'aquifer.default.json'));

        // If a config json path was passed in, extend the default.
        if (configJsonPath) {
          var configJson = jsonFile.readFileSync(configJsonPath);
          _.merge(this.config, configJson);
        }
      }

      // Set name, default to basename of directory.
      if (!this.config.name || this.config.name.length <= 0) {
        this.config.name = name || path.basename(directory);
      }

      // Define absolute paths to assets.
      this.absolutePaths = {
        json: jsonPath,
        make: path.join(directory, this.config.paths.make),
        settings: path.join(directory, this.config.paths.settings),
        root: path.join(directory, this.config.paths.root),
        drush: path.join(directory, this.config.paths.drush),
        build: path.join(directory, this.config.paths.build),
        themes: {
          root: path.join(directory, this.config.paths.themes.root),
          contrib: path.join(directory, this.config.paths.themes.contrib),
          custom: path.join(directory, this.config.paths.themes.custom)
        },
        modules: {
          root: path.join(directory, this.config.paths.modules.root),
          contrib: path.join(directory, this.config.paths.modules.contrib),
          custom: path.join(directory, this.config.paths.modules.custom),
          features: path.join(directory, this.config.paths.modules.features)
        },
        files: {
          root: path.join(directory, this.config.paths.files.root)
        }
      };

      // If build path is absolute, do not prepend the project directory.
      if (path.resolve(this.config.paths.build) === this.config.paths.build) {
        this.absolutePaths.build = this.config.paths.build;
      }

      resolve();
    });
  }

  /**
   * Creates and scaffolds this project as defined.
   * @returns {object} promise object.
   */
  create() {
    return new Promise((resolve, reject) => {
      // If this is already initialized, exit.
      if (this.aquifer.initialized) {
        reject(this.directory + ' already exists, or is already an aquifer project.');
        return;
      }

      // Create root, modules, builds, themes, and files folders.
      fs.mkdirSync(this.directory);
      fs.mkdirSync(this.absolutePaths.build);
      fs.mkdirSync(this.absolutePaths.settings);
      fs.mkdirSync(this.absolutePaths.root);
      fs.mkdirSync(this.absolutePaths.drush);
      fs.mkdirSync(this.absolutePaths.themes.root);
      fs.mkdirSync(this.absolutePaths.themes.custom);
      fs.mkdirSync(this.absolutePaths.modules.root);
      fs.mkdirSync(this.absolutePaths.modules.custom);
      fs.mkdirSync(this.absolutePaths.modules.features);
      fs.mkdirSync(this.absolutePaths.files.root);
      fs.mkdirSync(path.join(this.directory, '.aquifer'));

      // .gitkeeps in module, theme, and build folders
      touch.sync(path.join(this.absolutePaths.modules.custom, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.modules.features, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.themes.root, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.themes.custom, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.build, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.settings, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.root, '.gitkeep'));
      touch.sync(path.join(this.absolutePaths.files.root, '.gitkeep'));

      // Copy over src files.
      fs.copySync(path.join(this.srcDir, 'default.settings.php'), path.join(this.absolutePaths.settings, 'settings.php'));
      fs.copySync(path.join(this.srcDir, 'default.secret.settings.php'), path.join(this.absolutePaths.settings, 'secret.settings.php'));
      fs.copySync(path.join(this.srcDir, 'default.local.settings.php'), path.join(this.absolutePaths.settings, 'local.settings.php'));
      fs.copySync(path.join(this.srcDir, 'drupal.make.yml'), this.absolutePaths.make);
      fs.copySync(path.join(this.srcDir, 'drushrc.php'), path.join(this.absolutePaths.drush, 'drushrc.php'));
      fs.copySync(path.join(this.srcDir, 'editorconfig'), path.join(this.directory, '.editorconfig'));
      fs.copySync(path.join(this.srcDir, 'gitignore'), path.join(this.directory, '.gitignore'));
      fs.copySync(path.join(this.srcDir, 'package.json'), path.join(this.directory, '.aquifer/package.json'));
      fs.copySync(path.join(this.srcDir, 'root.htaccess'), path.join(this.absolutePaths.root, '.htaccess'));
      fs.copySync(path.join(this.srcDir, 'robots.txt'), path.join(this.absolutePaths.root, 'robots.txt'));
      fs.copySync(path.join(this.srcDir, 'files.htaccess'), path.join(this.absolutePaths.files.root, '.htaccess'));

      // Create aquifer.json file.
      jsonFile.writeFileSync(this.absolutePaths.json, this.config);
      resolve();
    })
  }

  /**
   * Updates the project json with a new object.
   *
   * @param {object} updateJson json that should be merged with project json.
   * @returns {object} promise object.
   */
  updateJson(updateJson) {
    return new Promise((resolve, reject) => {
      if (updateJson) {
        this.config = _.extend(this.config, updateJson);
        jsonFile.writeFileSync(this.absolutePaths.json, this.config);
      }

      resolve();
    })
  }
}

module.exports = Project;
