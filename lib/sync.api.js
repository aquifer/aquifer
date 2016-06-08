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
    this.config = this.project.config;
    this.items = {};
    this.itemsExcluded = [];
  }

  /**
   * Add items to the next sync execution.
   * @example
   * let items = {
   *   "path/to/dir/in/project": {
   *     "destination": "path/to/dir/in/build",
   *     "method": "symlink",
   *     "conflict": "overwrite"
   *   }
   * }
   * sync.addItems(items);
   * @param {object} items Items to add to the sync.
   * @returns {undefined} nothing.
   */
  addItems(items) {
    this.items = _.defaults(items, this.items);
  }

  /**
   * Exclude items next sync execution.
   * @example
   * let items = [
   *   "path/to/dir/in/project"
   * ]
   * sync.excludeItems(items);
   * @param {array} destinationPaths An array of destination paths to exclude
   *   from the sync.
   * @returns {undefined} nothing.
   */
  excludeItems(destinationPaths) {
    this.itemsExcluded = this.itemsExcluded.concat(destinationPaths);
  }

  /**
   * Executes syncing of items.
   * @param {string} buildDirectory Build directory relative to the project
   *   root. Defaults to build directory defined in aquifer.json.
   * @param {boolean} forceCopy Set true to force copying over symlinking for
   *   all items. Defaults to false.
   * @param {array} bundles Set true to force copying over symlinking for
   *   all items. Defaults to all sync bundles defined in aquifer.json.
   * @returns {object} promise object.
   */
  execute(buildDirectory, forceCopy, bundles) {
    this.aquifer.console.log('Beginning sync...');
    buildDirectory = typeof buildDirectory !== 'undefined' ? buildDirectory : this.config.build.directory;
    forceCopy = typeof forceCopy !== 'undefined' ? forceCopy : false;
    bundles = typeof bundles !== 'undefined' ? bundles : Object.keys(this.config.sync);
    let sync = this;
    let items = this.items;
    let itemsExcluded = this.itemsExcluded;

    if (bundles.length > 0) {
      items = _.defaults(items, this.getBundleItemsMultiple(bundles));
    }

    _.forIn(items, function(item, key) {
      if (itemsExcluded.indexOf(item.destination) === -1) {
        item.source = key;
        return sync.executeItem(item, buildDirectory, forceCopy);
      }
      else {
        console.log('Excluding: ' + key + ' => ' + item.destination);
      }
    });

    // Reset items and excluded items.
    this.items = {};
    this.itemsExcluded = [];
    this.aquifer.console.log('Sync complete.');
  }

  /**
   * Gets items defined in a single sync bundle.
   * @param {string} bundle Name of the sync bundle.
   * @returns {object} Sync items defined for the bundle.
   */
  getBundleItems(bundle) {
    return this.config.sync[bundle];
  }

  /**
   * Gets items defined in multiple sync bundles.
   * @param {array} bundles An array of sync bundle names.
   * @returns {object} Sync items defined for the bundles.
   */
  getBundleItemsMultiple(bundles) {
    let items = {};
    let sync = this;

    bundles.forEach(function(bundle) {
      items = _.defaults(items, sync.getBundleItems(bundle));
    });

    return items;
  }

  /**
   * Executes syncing of a single item.
   * @param {object} item The item to sync.
   * @param {string} buildDirectory Build directory relative to the project
   *   root. Defaults to build directory defined in aquifer.json.
   * @param {boolean} forceCopy Set true to force copying over symlinking for
   *   all items. Defaults to false.
   * @returns {object} promise object.
   */
  executeItem(item, buildDirectory, forceCopy) {
    buildDirectory = typeof buildDirectory !== 'undefined' ? buildDirectory : this.config.build.directory;
    forceCopy = typeof forceCopy !== 'undefined' ? forceCopy : false;

    return new Promise((resolve, reject) => {
      item.method = item.method || 'copy';
      item.conflict = item.conflict || 'overwrite';

      if (!item.source) {
        this.aquifer.console.log('Item with destination ' + item.destination + ' has no source property defined. Skipping.');
        return false;
      }

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
            method: item.method,
            conflict: item.conflict
          };

          return this.executeItem(childItem, buildDirectory, forceCopy);
        });
      }
      else {
        // Log this to the user.
        this.aquifer.console.log(((forceCopy || item.method === 'copy') ? 'Copying: ' : 'Symlinking: ') + item.source + ' => ' + item.destination);

        // Make source and destination paths absolute.
        item.source = path.join(this.project.directory, item.source);
        item.destination = path.join(this.project.getAbsolutePath(buildDirectory), item.destination);

        // If the source doesn't exist, skip this item.
        if (!fs.existsSync(item.source)) {
          this.aquifer.console.log('Source file does not exist. Skipping: ' + item.source, 'status');
          return false;
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
              return false;

            default:
              return false;
          }
        }

        // Make sure the destination base path exists.
        let destBase = path.dirname(item.destination);

        if (!fs.existsSync(destBase)) {
          this.aquifer.console.log('Destination directory does not exist. Creating: ' + destBase, 'status');
          fs.mkdirsSync(destBase);
        }

        // If symlinking is not turned on or the individual link method is copy,
        // copy the item.
        if (forceCopy || item.method === 'copy') {
          fs.copySync(item.source, item.destination);
        }
        // Otherwise create a symlink.
        else {
          let type = 'file';

          if (fs.statSync(item.source).isDirectory()) {
            type = 'dir';
          }

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
}

module.exports = Sync;
