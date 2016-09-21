/**
 * @file
 * Contains the build API for Aquifer.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const del = require('del');
const path = require('path');

/**
 * Constructs build API for Aquifer.
 *
 * @class
 * @classdesc Contains build API for Aquifer.
 */
class Build {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    this.aquifer = Aquifer;
    this.project = this.aquifer.project;
    this.destination = this.project.getAbsolutePath('build');
    this.options = {
      symlink: true,
      delPatterns: ['*', '.*'],
      excludeLinks: [],
      addLinks: [],
      makeFile: this.project.getAbsolutePath('drupal.make.yml')
    }
  }

  /**
   * Creates a build object from which operations can be initiated.
   *
   * @param {string} destination Path to destination folder.
   * @param {object} options Configuration options for the build.
   * @param {object[]} options.buildMethod string identifying the build method to use.
   * @param {object[]} options.makeFile string path to make file.
   * @param {bool} options.symlink Whether the build should copy or symlink directories.
   * @param {object[]} options.delPatterns Patterns indicating what should be deleted when clearing existing builds.
   * @param {object[]} options.excludeLinks An array of link destinations to exclude.
   * @param {object[]} options.addLinks An array additional links to create during the build.
   * @param {string} options.addLinks[].src The link source relative to the project root.
   * @param {string} options.addLinks[].dest The link destination relative to the build.
   * @param {string} options.addLinks[].type The link type ("file" or "dir").
   * @returns {object} promise object.
   */
  create(destination, options) {
    return new Promise((resolve, reject) => {
      let run = new this.aquifer.api.run(this.aquifer);
      let sync = new this.aquifer.api.sync(this.aquifer);
      let project = this.project;

      // Set class properties.
      this.destination = project.getAbsolutePath(destination);
      if (options) {
        _.assign(this.options, options);
      }

      // If project isn't initialized (doesn't exist) then exit.
      if (!this.aquifer.initialized) {
        reject('Cannot build a project that hasn\'t been initialized.');
      }

      // Set some reasonable defaults.
      this.options.makeFile = project.getAbsolutePath(this.options.makeFile) || project.absolutePaths.makeFile;
      this.options.buildMethod = this.options.buildMethod || project.config.build.method;

      // Make sure the make file exists.
      try {
        fs.statSync(this.options.makeFile);
      }
      // If there was an exception, the make file probably doesn't exist.
      catch (error) {
        reject(error);
        return;
      }

      // If the destination does not exist (was deleted or first build) create.
      if (!fs.existsSync(this.destination)) {
        fs.mkdirSync(this.destination);
      }

      // Set sites/default files permission (HFS+ issues).
      this.aquifer.console.log('Re-setting permissions...');
      let defaultDir = path.join(this.destination, 'sites/default');
      if (fs.existsSync(defaultDir)) {
        fs.chmodSync(defaultDir, '755');
      }

      // Remove any existing build directories.
      this.aquifer.console.log('Removing possible existing build...');
      del.sync(this.options.delPatterns, { cwd: this.destination });

      // Set environment variables for use in scripts and run commands.
      process.env['AQUIFER_PROJECT_ROOT'] = project.directory;
      process.env['AQUIFER_DRUPAL_ROOT'] = destination;

      // Execute preBuild sync.
      sync.execute(destination, !this.options.symlink, 'preBuild')

      // Execute build.
      .then(() => {
        let command = '';
        let commandOptions = {};

        // In the future defer to a "build plugin" to run the command needed.
        if (this.options.buildMethod === 'drush make') {
          command = 'drush make -y ' + this.options.makeFile;
          commandOptions = {cwd: this.destination};
        }
        else if (this.options.buildMethod === 'composer') {
          command = 'composer install -d ' + path.dirname(this.options.makeFile);
          commandOptions = {cwd: this.destination};
        }

        // Run build command.
        this.aquifer.console.log('Executing ' + this.options.buildMethod + '...');
        return run.invoke(command, commandOptions);
      })

      // Run pre-sync commands.
      .then(() => {
        let preSyncCommands = project.config.run.preSync;

        if (preSyncCommands && preSyncCommands.length) {
          this.aquifer.console.log('Running pre-sync commands...', 'status');
          return run.invokeAll(preSyncCommands);
        }
      })

      // Execute postBuild sync.
      .then(() => {
        // Copy or symlink custom code files and directories.
        this.aquifer.console.log(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...');

        // Handle addLinks option.
        if (this.options.addLinks.length > 0) {
          let addItems = {};

          // Provide the structure required by the Sync API.
          this.options.addLinks.forEach(function(item) {
            addItems[item.src] = {
              destination: item.dest,
              required: typeof item.required !== 'undefined' ? item.required : false,
              hook: "postBuild"
            }
          });

          sync.addItems(addItems);
        }

        // Handle excludeLinks option.
        if (this.options.excludeLinks.length > 0) {
          sync.excludeItems(this.options.excludeLinks);
        }

        // Execute postBuild sync.
        return sync.execute(destination, !this.options.symlink, 'postBuild');
      })

      // Run post-build commands.
      .then(() => {
        let postBuildCommands = project.config.run.postBuild;

        if (postBuildCommands && postBuildCommands.length) {
          this.aquifer.console.log('Running post-build commands...', 'status');
          return run.invokeAll(postBuildCommands);
        }
      })

      // Clean up environment variables.
      .then(() => {
        delete process.env['AQUIFER_PROJECT_ROOT'];
        delete process.env['AQUIFER_DRUPAL_ROOT'];
      })

      // Resolve on finish, or reject if there's a problem.
      .catch((reason) => {
        reject(reason);
      })
      .then(() => {
        resolve();
      });
    })
  }

}

module.exports = Build;
