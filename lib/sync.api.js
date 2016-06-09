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
   * Executes syncing of items.
   * @param {string} [buildDirectory=Aquifer.config.build.directory] Build
   *   directory relative to the project root. Defaults to build directory
   *   defined in aquifer.json.
   * @param {boolean} [forceCopy=false] Set true to force copying over
   *   symlinking for all items.
   * @param {(boolean|array)} [bundles=true] Set true to include all sync
   *   bundles in the sync, false to not include any of the defined sync
   *   bundles. Enter an array of sync bundle names to include only those
   *   bundles in the sync.
   * @returns {object} promise object.
   */
  execute(buildDirectory, forceCopy, bundles) {
    buildDirectory = typeof buildDirectory !== 'undefined' ? buildDirectory : this.config.build.directory;
    forceCopy = typeof forceCopy !== 'undefined' ? forceCopy : false;
    bundles = typeof bundles !== 'undefined' ? bundles : true;
    let sync = this;
    let items = this.items;
    let itemsArr = [];
    let itemsExcluded = this.itemsExcluded;
    let aquiferConsole = this.aquifer.console;

    aquiferConsole.log('Starting sync...');

    // If bundles is true, queue all bundles.
    if (bundles === true) {
      bundles = Object.keys(this.config.sync);
    }

    // Queue defined bundles.
    if (Array.isArray(bundles) && bundles.length > 0) {
      items = _.defaults(items, this.getBundleItemsMultiple(bundles));
    }

    // Iterate items object and add items to the items array for processing.
    if (!_.isEmpty(items)) {
      _.forIn(items, function (item, key) {
        // If item is not excluded, add to the array.
        if (itemsExcluded.indexOf(item.destination) === -1) {
          item.source = key;
          itemsArr.push(item);
        }
          // Otherwise skip it and inform the user.
        else {
          aquiferConsole.log('Excluding: ' + key + ' => ' + item.destination);
        }
      });
    }
    else {
      aquiferConsole.log('Nothing to sync.');
    }

    // Process items.
    let itemPromises = itemsArr.map(
      function (item) {
        return sync.executeItem(item, buildDirectory, forceCopy);
      }
    );

    return Promise.all(itemPromises)
      .then(function (results) {
        // Reset items and excluded items.
        sync.reset();
        aquiferConsole.log('Sync complete.');
      })
      .catch(function (error) {
        sync.reset();
        aquiferConsole.log(error, 'error');
      });
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
    forceCopy = typeof forceCopy !== 'undefined' ? forceCopy : true;

    return new Promise((resolve, reject) => {
      let aquiferConsole = this.aquifer.console;
      item.method = typeof item.method !== 'undefined' ? item.method : 'copy';
      item.conflict = typeof item.conflict !== 'undefined' ? item.conflict : 'overwrite';
      item.required = typeof item.required !== 'undefined' ? item.required : false;

      // Item must have a source property defined.
      if (typeof item.source === 'undefined' || !item.source) {
        reject('Item with destination ' + item.destination + ' has no source property defined. Skipping.');
        return;
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
              conflict: item.conflict,
              required: item.required
            };

            this.executeItem(childItem, buildDirectory, forceCopy)
              .catch(function (error) {
                aquiferConsole.log('Error: ' + error, 'error');
              });
          });

        resolve();
        return;
      }

      // Log sync action.
      aquiferConsole.log(((forceCopy || item.method === 'copy') ? 'Copying: ' : 'Symlinking: ') + item.source + ' => ' + item.destination);

      // Make source and destination paths absolute.
      item.source = path.join(this.project.directory, item.source);
      item.destination = path.join(this.project.getAbsolutePath(buildDirectory), item.destination);

      // If the source doesn't exist, skip this item.
      if (!fs.existsSync(item.source)) {
        if (item.required) {
          reject('Error: Required item failed to sync. Source does not exist: ' + item.source);
          return;
        }
        else {
          aquiferConsole.log('Source does not exist: ' + item.source + '. Skipping.', 'status');
          resolve();
          return;
        }
      }

      // Handle existing destinations.
      if (fs.existsSync(item.destination)) {
        switch (item.conflict) {
          case 'overwrite':
            aquiferConsole.log('Destination exists. Conflict set to overwrite. \nOverwriting: ' + item.destination, 'status');
            del.sync(item.destination);
            break;

          case 'skip':
            aquiferConsole.log('Destination exists. Conflict set to skip. \nSkipping: ' + item.destination, 'status');
            resolve();
            return;

          default:
            if (item.required) {
              reject('Error: Required item failed to sync. Unsupported or empty conflict property for: ' + item.source);
            }
            else {
              aquiferConsole.log('Unsupported or empty conflict property for: ' + item.source + '. Skipping.', 'status');
            }
        }

        return;
      }

      // Make sure the destination base path exists.
      let destBase = path.dirname(item.destination);

      if (!fs.existsSync(destBase)) {
        aquiferConsole.log('Destination directory does not exist. Creating: ' + destBase, 'status');
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
    })
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
   * Resets items object and excluded items array.
   * @returns {undefined} nothing.
   */
  reset() {
    this.items = {};
    this.itemsExcluded = [];
  }

}

module.exports = Sync;
