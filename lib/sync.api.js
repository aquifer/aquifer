/**
 * @file
 * Contains the Sync API for Aquifer.
 */

'use strict';

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const del = require('del');
const path = require('path');

/**
 * Constructs the Sync API for Aquifer.
 *
 * @class
 * @classdesc Contains the Sync API for Aquifer.
 */
class Sync {

  /**
   * Scaffolds properties and initializes class.
   * @param {object} Aquifer Current instance of Aquifer.
   * @returns {undefined} nothing.
   */
  constructor(Aquifer) {
    this.aquifer = Aquifer;
    this.project = this.aquifer.project;
  }

  /**
   * Executes syncing of a single item.
   * @param {object} item The item to sync.
   * @param {string} buildDirectory Options to pass to spawn.
   * @param {string} env The name of the environment on which to invoke.
   * @returns {object} promise object.
   */
  execute(item, buildDirectory, forceCopy) {
    buildDirectory = buildDirectory || this.project.config.build.directory;

    return new Promise((resolve, reject) => {
      // If destination is the Drupal root and the source is a directory
      // assume we want to copy/sync the contents. Iterate over contents
      // add them to the links array individually.
      if (!item.destination && fs.statSync(path.join(this.project.directory, item.source)).isDirectory()) {
        fs.readdirSync(path.join(this.project.directory, item.source))
        .filter((child) => {
          return child.indexOf('.gitkeep') !== 0;
        })
        .forEach((child) => {
          let childItem = {
            source: path.join(item.source, child),
            destination: path.join(item.destination, child),
            method: item.method || 'copy',
            conflict: item.conflict || 'overwrite'
          };

          return this.execute(childItem, buildDirectory, forceCopy);
        });
      }
      else {
        // Log this to the user.
        this.aquifer.console.log(((forceCopy || item.method === 'copy') ? 'Copying ' : 'Symlinking ') + item.source + ' => ' + item.destination);

        // Make source and destination paths absolute.
        item.source = path.join(this.project.directory, item.source);
        item.destination = path.join(this.project.getAbsolutePath(buildDirectory), item.destination);

        let destBase = path.dirname(item.destination);
        let type = 'file';

        if (fs.statSync(item.source).isDirectory()) {
          type = 'dir';
        }

        // If the source doesn't exist, skip this item.
        if (!fs.existsSync(item.source)) {
          this.aquifer.console.log('Source file does not exist. Skipping: ' + item.source, 'status');
          reject();
        }

        // Handle existing destinations.
        if (fs.existsSync(item.destination)) {
          switch (item.conflict) {
            case 'overwrite':
              this.aquifer.console.log('Destination exists. Conflict set to overwrite. \nOverwriting: ' + item.destination, 'status');
              del.sync(item.destination);
              break;

            case 'skip':
              this.aquifer.console.log('Destination exists. Conflict set to skip. \nSkipping: ' + item.destination, 'status');
              reject();
              break;

            default:
              reject();
          }
        }

        // Make sure the destination base path exists.
        if (!fs.existsSync(destBase)) {
          this.aquifer.console.log('Destination directory does not exist. Creating: ' + destBase, 'status');
          fs.mkdirsSync(destBase);
        }

        // If symlinking is not turned on or the individual link method is copy,
        // copy the item.
        if (forceCopy || item.method === 'copy') {
          fs.copySync(item.source, item.destination);
        }
        // Create symlink
        else {
          // Change current directory to the destination base path (minus last
          // part of path).
          process.chdir(destBase);

          // Symlink the relative path of the src from the destination into the
          // basename of the path.
          fs.symlinkSync(path.relative(destBase, item.source), path.basename(item.destination), type);

          // Change the working directory back to the original.
          process.chdir(this.aquifer.cwd);
        }

        resolve();
      }
    })
  }

  executeBundles(bundles, buildDirectory, forceCopy) {
    let config = this.project.config.sync;
    let sync = this;

    bundles.forEach(function(bundle) {
      _.forIn(config[bundle], function(item, key) {
        item.source = key;
        sync.execute(item, buildDirectory, forceCopy);
      });
    });
  }

}

module.exports = Sync;
