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
   * @param {int} drupalVersion The version of Drupal this project represents.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer, drupalVersion) {
    // Scaffold class properties.
    this.aquifer = Aquifer;
    this.config = {};
    this.paths = {};
    this.absolutePaths = {};
    this.drupalVersion = drupalVersion || 7;
    this.srcDir = '';
    this.destPaths = {};
    this.setDrupalVersion(this.drupalVersion);

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

      // If this project has no defined core version, default to 7.
      this.config.core = this.config.core || this.drupalVersion;
      this.setDrupalVersion(this.config.core);

      // Define absolute paths to assets.
      this.absolutePaths = {
        json: jsonPath,
        make: path.join(directory, this.config.build.makeFile),
        build: path.join(directory, this.config.build.directory),
      };

      // If build path is absolute, do not prepend the project directory.
      if (path.resolve(this.config.build.directory) === this.config.build.directory) {
        this.absolutePaths.build = this.config.build.directory;
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

      // Create Aquifer directories.
      fs.mkdirSync(this.directory);
      fs.mkdirSync(path.join(this.directory, '.aquifer'));

      // Create Drupal sync directories.
      Object.keys(this.config.sync).forEach((key) => {
        let item = this.config.sync[key];

        if (typeof item.type !== 'undefined' && item.type === 'dir') {
          // Create directory.
          fs.mkdirsSync(path.join(this.directory, key));
          // Add .gitkeep.
          touch.sync(path.join(this.directory, key, '.gitkeep'));
        }
      });

      // Copy over Aquifer src files.
      fs.copySync(path.join(this.srcDir, 'drupal.make.yml'), this.absolutePaths.make);
      fs.copySync(path.join(this.srcDir, 'editorconfig'), path.join(this.directory, '.editorconfig'));
      fs.copySync(path.join(this.srcDir, 'gitignore'), path.join(this.directory, '.gitignore'));
      fs.copySync(path.join(this.srcDir, 'package.json'), path.join(this.directory, '.aquifer/package.json'));

      // Copy over Drupal src files.
      fs.copySync(path.join(this.srcDir, 'root.htaccess'), path.join(this.directory, 'root/.htaccess'));
      fs.copySync(path.join(this.srcDir, 'robots.txt'), path.join(this.directory, 'root/robots.txt'));
      fs.copySync(path.join(this.srcDir, 'default.settings.php'), path.join(this.directory, 'settings/settings.php'));
      fs.copySync(path.join(this.srcDir, 'default.secret.settings.php'), path.join(this.directory, 'settings/secret.settings.php'));
      fs.copySync(path.join(this.srcDir, 'default.local.settings.php'), path.join(this.directory, 'settings/local.settings.php'));
      fs.copySync(path.join(this.srcDir, 'files.htaccess'), path.join(this.directory, 'files/.htaccess'));

      // If this project is Drupal 8 or higher, copy over files needed for
      // Composer support.
      if (this.drupalVersion >= 8) {
        console.log(this.drupalVersion)
        fs.copySync(path.join(this.srcDir, 'composer.json'), path.join(this.directory, 'root/composer.json'));
        fs.ensureFileSync(path.join(this.directory, 'root/composer.lock'));
        fs.copySync(path.join(this.srcDir, 'scripts'), path.join(this.directory, 'scripts'));
      }

      // Create aquifer.json file.
      jsonFile.writeFileSync(this.absolutePaths.json, this.config, {spaces: 2});
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
        jsonFile.writeFileSync(this.absolutePaths.json, this.config, {spaces: 2});
      }

      resolve();
    })
  }

  /**
   * Does all the leg-work of setting the major drupal version.
   *
   * @param {int} version the major version number of the drupal build.
   * @returns {undefined} nothing.
   */
  setDrupalVersion(version) {
    const destPaths = {
      '7': {
        'profiles': 'profiles/',
        'drush': 'sites/all/drush',
        'modules': 'sites/all/modules',
        'themes': 'sites/all/themes',
        'site': 'sites/default'
      },
      '8': {
        'profiles': 'profiles',
        'drush': 'drush',
        'modules': 'modules',
        'themes': 'themes',
        'site': 'sites/default'
      }
    };

    this.drupalVersion = version;
    this.srcDir = path.join(path.dirname(fs.realpathSync(__filename)), '../src', 'd' + this.drupalVersion);
    this.destPaths = destPaths[version];
  }

  /**
   * Returns the absolute path of the input path within an Aquifer project.
   *
   * @param {string} relativePath relative path to an asset within an Aquifer
   * project.
   * @returns {string} absolute version of path.
   */
  getAbsolutePath(relativePath) {
    let absolutePath = relativePath;
    if (path.resolve(relativePath) !== relativePath) {
      absolutePath = path.join(this.directory, relativePath);
    }

    return absolutePath;
  }
}

module.exports = Project;
