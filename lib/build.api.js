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
    this.destination = this.getAbsolutePath('build');
    this.options = {
      symlink: true,
      delPatterns: ['*'],
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
   * @param {bool} options.symlink Whether the build should copy or symlink directories.
   * @param {object[]} options.delPatterns Patterns indicating what should be deleted when clearing existing builds.
   * @param {object[]} options.excludeLinks An array of link destinations to exclude.
   * @param {object[]} options.addLinks An array additional links to create during the build.
   * @param {object[]} options.makeFile string path to make file.
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
      del(this.options.delPatterns, { cwd: this.destination });

      // Run drush make.
      this.aquifer.console.log('Executing drush make...');
      run.invoke('drush make -y ' + this.options.makeFile, {cwd: this.destination})

      // Copy or symlink custom code files and directories.
      .then(() => {
        this.aquifer.console.log(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...');
        let links = [];
        let project = this.aquifer.project;

        // Add installation profiles.
        if (project.config.paths.profiles) {
          Object.keys(project.config.paths.profiles).forEach((key) => {
            links.push({
              src: project.config.paths.profiles[key],
              dest: path.join(project.destPaths.profiles, key)
            });
          });
        }

        // Add Drush files.
        if (project.config.paths.drush) {
          links.push({
            src: project.config.paths.drush,
            dest: project.destPaths.drush
          });
        }

        // Add directories.
        Object.keys(project.config.directories).forEach((key) => {

          if (fs.existsSync(path.join(project.directory, key))) {
            let data = project.config.directories[key];

            if (data.destination) {

              links.push({
                src: key,
                dest: data.destination
              });
            }
            else {
              fs.readdirSync(path.join(project.directory, key))
              .filter((item) => {
                return item.indexOf('.gitkeep') !== 0;
              })
              .forEach((item) => {
                let itemPath = path.join(project.directory, key, item);

                links.push({
                  src: path.join(key, item),
                  dest: item
                });
              });
            }
          }
        });

        // Add settings files links.
        fs.readdirSync(project.absolutePaths.settings)
          .filter((file) => {
            return file.indexOf('.') !== 0;
          })
          .forEach((file) => {
            links.push({
              src: path.join(project.config.paths.settings, file),
              dest: path.join(project.destPaths.site, file)
            });
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
          this.aquifer.console.log((this.options.symlink ? 'Symlinking ' : 'Copying ') + link.src + ' => ' + link.dest)

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
            return;
          }

          // Make sure the destination base path exists.
          if (!fs.existsSync(destBase)) {
            this.aquifer.console.log('Destination directory does not exist. Creating: ' + destBase, 'status');
            fs.mkdirSync(destBase);
          }

          // Delete existing files if they exist.
          if (fs.existsSync(link.dest)) {
            fs.unlinkSync(link.dest);
          }

          // If symlinking is turned on, symlink custom files. Else, copy.
          if (this.options.symlink) {
            // Make sure the destination base path exists.
            if (!fs.existsSync(destBase)) {
              fs.mkdirSync(destBase);
            }

            // Change current directory to the destination base path (minus last part of path).
            process.chdir(destBase);

            // Symlink the relative path of the src from the destination into the basename of the path.
            fs.symlinkSync(path.relative(destBase, link.src), path.basename(link.dest), type);

            // Change the working directory back to the original.
            process.chdir(this.aquifer.cwd);
          }
          else {
            fs.copySync(link.src, link.dest);
          }
        })
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
