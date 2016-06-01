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
const replace = require('replace');

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
    this.destination = this.getAbsolutePath('build');
    this.options = {
      symlink: true,
      delPatterns: ['*', '.*'],
      excludeLinks: [],
      addLinks: [],
      makeFile: this.getAbsolutePath('drupal.make.yml')
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

      // Set class properties.
      this.destination = this.getAbsolutePath(destination);
      if (options) {
        _.assign(this.options, options);
      }

      // If project isn't initialized (doesn't exist) then exit.
      if (!this.aquifer.initialized) {
        reject('Cannot build a project that hasn\'t been initialized.');
      }
      let project = this.aquifer.project;

      // Set some reasonable defaults.
      this.options.makeFile = this.getAbsolutePath(this.options.makeFile) || project.absolutePaths.makeFile;
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

      let command = '';
      let commandOptions = {};

      // In the future defer to a "build plugin" to run the command needed.
      if (this.options.buildMethod === 'drush make') {
        command = 'drush make -y ' + this.options.makeFile;
        commandOptions = {cwd: this.destination};
      }
      else if (this.options.buildMethod === 'composer') {
        // If the destination is different that our config build directory value
        // then this is probably getting run by aquifer git.
        if (destination !== project.config.build.directory) {
          let buildDir = path.join(project.directory, destination);

          // Copy composer files to the build directory.
          fs.copySync(path.join(project.directory, 'composer.json'), path.join(buildDir, 'composer.json'));
          fs.copySync(path.join(project.directory, 'composer.lock'), path.join(buildDir, 'composer.lock'));
          fs.copySync(path.join(project.directory, 'scripts'), path.join(buildDir, 'scripts'));

          // Replace the build directory strings in composer.json. Kinda janky.
          replace({
            regex: '"' + project.config.build.directory + '/',
            replacement: '"',
            paths: [path.join(buildDir, 'composer.json')],
            recursive: false,
            silent: true
          });

          // Run composer install inside the build directory.
          command = 'bash -c "cd ' + buildDir + ' && composer install"';
        }
        else {
          command = 'composer install -d ' + path.dirname(this.options.makeFile);
          commandOptions = {cwd: this.destination};
        }
      }

      // Run build command.
      this.aquifer.console.log('Executing ' + this.options.buildMethod + '...');
      run.invoke(command, commandOptions)
      // Run pre-sync commands.
      .then(() => {
        let preSyncCommands = project.config.run.preSync;

        if (preSyncCommands && preSyncCommands.length) {
          this.aquifer.console.log('Running pre-sync commands...', 'status');
          return run.invokeAll(preSyncCommands);
        }
      })

      // Copy or symlink custom code files and directories.
      .then(() => {
        this.aquifer.console.log(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...');
        let links = [];
        let project = this.aquifer.project;
        // We don't need to distinguish between directories and files at this
        // point so let's combine the config.
        let syncItems = _.defaults(project.config.sync.directories, project.config.sync.files);

        // Add items to the links array.
        Object.keys(syncItems).forEach((key) => {
          // Make sure the source exists in the project.
          if (fs.existsSync(path.join(project.directory, key))) {
            let data = syncItems[key];

            // If destination is the Drupal root and the source is a directory
            // assume we want to copy/sync the contents. Iterate over contents
            // add them to the links array individually.
            if (!data.destination && fs.statSync(key).isDirectory()) {
              fs.readdirSync(path.join(project.directory, key))
                .filter((item) => {
                  return item.indexOf('.gitkeep') !== 0;
                })
                .forEach((item) => {
                  links.push({
                    src: path.join(key, item),
                    dest: item,
                    method: data.method,
                    conflict: data.conflict
                  });
                });
            }
            else {
              links.push({
                src: key,
                dest: data.destination,
                method: data.method,
                conflict: data.conflict
              });
            }
          }
        });

        // Add links from options.
        links = links.concat(this.options.addLinks);

        // Exclude links from options.
        links = links.filter((link) => {
          return this.options.excludeLinks.indexOf(link.dest) === -1;
        });

        // Create links or copies.
        links.forEach((link) => {
          // Log this to the user.
          this.aquifer.console.log(((!this.options.symlink || link.method === 'copy') ? 'Copying ' : 'Symlinking ') + link.src + ' => ' + link.dest)

          // Make src and dest paths absolute. Determine destination base path.
          link.dest = path.join(this.destination, link.dest);
          link.src = path.join(project.directory, link.src);
          let destBase = path.dirname(link.dest);
          let type = 'file';

          if (fs.statSync(link.src).isDirectory()) {
            type = 'dir';
          }

          // If the source doesn't exist, skip this link.
          if (!fs.existsSync(link.src)) {
            this.aquifer.console.log('Source file does not exist. Skipping: ' + link.src, 'status');
            return false;
          }

          // Handle existing destinations.
          if (fs.existsSync(link.dest)) {
            switch (link.conflict) {
              case 'overwrite':
                this.aquifer.console.log('Destination exists. Conflict set to overwrite. \nOverwriting: ' + link.dest, 'status');
                del.sync(link.dest);
                break;

              case 'skip':
                this.aquifer.console.log('Destination exists. Conflict set to skip. \nSkipping: ' + link.dest, 'status');
                return false;

              default:
                return false;
            }
          }

          // Make sure the destination base path exists.
          if (!fs.existsSync(destBase)) {
            this.aquifer.console.log('Destination directory does not exist. Creating: ' + destBase, 'status');
            fs.mkdirsSync(destBase);
          }

          // If symlinking is not turned on or the individual link method is
          // copy, copy the item.
          if (!this.options.symlink || link.method === 'copy') {
            fs.copySync(link.src, link.dest);
          }
          // Create symlink
          else {
            // Change current directory to the destination base path (minus last part of path).
            process.chdir(destBase);

            // Symlink the relative path of the src from the destination into the basename of the path.
            fs.symlinkSync(path.relative(destBase, link.src), path.basename(link.dest), type);

            // Change the working directory back to the original.
            process.chdir(this.aquifer.cwd);
          }
        })
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

  /**
   * Returns the absolute path of the given relative path to an asset within an Aquifer project..
   * @param {string} relativePath relative path to an asset within an Aquifer project.
   * @returns {string} absolute version of path.
   */
  getAbsolutePath(relativePath) {
    let absolutePath = relativePath;
    if (path.resolve(relativePath) !== relativePath) {
      absolutePath = path.join(this.aquifer.project.directory, relativePath);
    }

    return absolutePath;
  }
}

module.exports = Build;
