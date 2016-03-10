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
const drush = require('drush-node');

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

      // Initialize drush and the build promise chain.
      drush.init({ log: true, cwd: this.destination })

      // Run drush make.
      .then(() => {
        return new Promise((res, rej) => {
          this.aquifer.console.log('Executing drush make...');
          drush.exec(['make', this.options.makeFile]).then(() => {
            res();
          })
        })
      })

      // Copy or symlink custom code files and directories.
      .then(() => {
        this.aquifer.console.log(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...');
        let links = [];
        let project = this.aquifer.project;
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
        const versionDestPaths = destPaths[project.drupalVersion];

        // Add installation profiles.
        if (project.config.paths.profiles) {
          Object.keys(project.config.paths.profiles).forEach((key) => {
            links.push({
              src: project.config.paths.profiles[key],
              dest: path.join(versionDestPaths.profiles, key),
              type: 'dir'
            });
          });
        }

        // Add Drush files.
        if (project.config.paths.drush) {
          links.push({
            src: project.config.paths.drush,
            dest: versionDestPaths.drush,
            type: 'dir'
          });
        }

        // Add module links.
        Object.keys(project.config.paths.modules).forEach((key) => {
          if (key !== 'root' && key !== 'contrib') {
            links.push({
              src: project.config.paths.modules[key],
              dest: path.join(versionDestPaths.modules, key),
              type: 'dir'
            });
          }
        });

        // Add themes links.
        Object.keys(project.config.paths.themes).forEach((key) => {
          if (key !== 'root' && key !== 'contrib') {
            links.push({
              src: project.config.paths.themes[key],
              dest: path.join(versionDestPaths.themes, key),
              type: 'dir'
            });
          }
        });

        // Add files link.
        links.push({
          src: project.config.paths.files.root,
          dest: path.join(versionDestPaths.site, 'files'),
          type: 'dir'
        });

        // Add settings files links.
        fs.readdirSync(project.absolutePaths.settings)
          .filter((file) => {
            return file.indexOf('.') !== 0;
          })
          .forEach((file) => {
            links.push({
              src: path.join(project.config.paths.settings, file),
              dest: path.join(versionDestPaths.site, file),
              type: 'file'
            });
          });

        // Add core file overrides.
        fs.readdirSync(project.absolutePaths.root)
        .filter((file) => {
          return file.indexOf('.gitkeep') !== 0;
        })
        .forEach((file) => {
          // Delete existing files if they exist.
          if (fs.existsSync(path.join(this.destination, file))) {
            fs.unlinkSync(path.join(this.destination, file));
          }

          links.push({
            src: path.join(project.config.paths.root, file),
            dest: file,
            type: 'file'
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

          // If symlinking is turned on, symlink custom files. Else, copy.
          if (this.options.symlink) {

            // Make sure the destination base path exists.
            if (!fs.existsSync(destBase)) {
              fs.mkdirSync(destBase);
            }

            // Change current directory to the destination base path (minus last part of path).
            process.chdir(destBase);

            // Symlink the relative path of the src from the destination into the basename of the path.
            fs.symlinkSync(path.relative(destBase, link.src), path.basename(link.dest), link.type);

            // Change the working directory back to the original.
            process.chdir(this.aquifer.cwd);
          }
          else {
            fs.copySync(link.src, link.dest);
          }
        })
      })

      // Resolve on finish, or reject if there's a problem.
      // @TODO: Adjust this to use .catch instead of a .then callback when
      // we migrate to using Aquifer run, and use es6 promises.
      .then(() => {
        resolve();
      }, (reason) => {
        reject(reason);
      })
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
