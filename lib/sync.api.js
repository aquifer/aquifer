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
   * @param {string} hook Name of the hook being called. Optional.
   * @param {string} type Type of items to sync: 'file' or 'dir'. Optional.
   * @returns {object} promise object.
   */
  execute(buildDirectory, forceCopy, hook, type) {
    buildDirectory = buildDirectory || this.config.build.directory;
    forceCopy = forceCopy || false;
    hook = hook || false;
    type = type || false;

    return this.getItems(hook, type)
    .then((itemsArr) => {
      this.aquifer.console.log('Starting ' + (hook ? hook + ' ' : '') + 'sync...');

      // Process items.
      let itemPromises = itemsArr.map((item) => {
        return this.executeItem(item, buildDirectory, forceCopy);
      });

      return Promise.all(itemPromises)
    })
    .then(() => {
      // Reset items and excluded items.
      this.reset();
      this.aquifer.console.log((hook ? hook + ' s' : 'S') + 'ync complete.');
    })
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
    buildDirectory = buildDirectory || this.config.build.directory;
    forceCopy = typeof forceCopy !== 'undefined' ? forceCopy : true;

    return new Promise((resolve, reject) => {
      let defaultItem = {
        method: 'copy',
        conflict: 'overwrite',
        required: false,
        contents: false
      };

      _.defaults(item, defaultItem);

      // If item.destination is the build directory and item.source is a
      // directory and item.contents is false, prevent the build directory from
      // getting overwritten. This is an unwanted misconfiguration; abort the
      // build.
      if (!item.destination && !item.contents && fs.statSync(path.join(this.project.directory, item.source)).isDirectory()) {
        this.aquifer.console.log('Source "' + item.source + '" will overwrite the build directory. Set the "contents" property to true to sync contents only.', 'error');
      }

      // Item must have a source property defined.
      if (!item.hasOwnProperty('source') || !item.source) {
        reject('Item with destination ' + item.destination + ' has no source defined. Skipping.');
        return;
      }

      // If item.source is a directory and item.contents is set to true, sync
      // the contents individually instead of the parent directory.
      if (item.contents && fs.statSync(path.join(this.project.directory, item.source)).isDirectory()) {
        let contentsChain = [];

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

          contentsChain.push(this.executeItem(childItem, buildDirectory, forceCopy));
        });

        Promise.all(contentsChain)
        .then(() => {
          resolve();
        })
        .catch((reason) => {
          reject(reason);
        })

        return;
      }

      // Log sync action.
      this.aquifer.console.log(((forceCopy || item.method === 'copy') ? 'Copying: ' : 'Symlinking: ') + item.source + ' => ' + item.destination);

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
          this.aquifer.console.log('Source does not exist: ' + item.source + '. Skipping.', 'status');
          resolve();
          return;
        }
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
            resolve();
            return;

          default:
            if (item.required) {
              reject('Error: Required item failed to sync. Unsupported or empty conflict property for: ' + item.source);
              return;
            }
            else {
              this.aquifer.console.log('Unsupported or empty conflict property for: ' + item.source + '. Skipping.', 'status');
            }
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
        if (!item.hasOwnProperty('type')) {
          item.type = 'file';

          if (fs.statSync(item.source).isDirectory()) {
            item.type = 'dir';
          }
        }

        // Change current directory to the destination base path (minus last
        // part of path).
        process.chdir(destBase);

        // Symlink the relative path of the src from the destination into the
        // basename of the path.
        fs.symlinkSync(path.relative(destBase, item.source), path.basename(item.destination), item.type);

        // Change the working directory back to the original.
        process.chdir(this.aquifer.cwd);
      }

      // Validate required item exists.
      if (item.required && !fs.existsSync(item.destination)) {
        reject('Error: Required item failed to sync: ' + item.source);
        return;
      }

      // Validate symlinks and copies.
      if (fs.existsSync(item.destination)) {
        let stat = fs.lstatSync(item.destination);

        if ((forceCopy || item.method === 'copy') && stat.isSymbolicLink()) {
          reject('Error: Item symlinked instead of copied: ' + item.destination);
          return;
        }

        if (!forceCopy && item.method === 'symlink' && !stat.isSymbolicLink()) {
          reject('Error: Item copied instead of symlinked: ' + item.destination);
          return;
        }
      }

      resolve();
    })
  }

  /**
   * Gets items defined in a single sync bundle.
   * @param {string} hook Name of the hook being called. Optional.
   * @param {string} type Type of items to sync: 'file' or 'dir'. Optional.
   * @returns {object} promise object which is resolved with the items array.
   */
  getItems(hook, type) {
    return new Promise((resolve, reject) => {
      hook = hook || false;
      type = type || false;
      let items = this.items;
      let configItems = this.config.sync;
      let itemsArr = [];
      let itemsExcluded = this.itemsExcluded;

      // Combine items from configuration with added items.
      items = _.defaults(items, configItems);

      // Add the source property.
      _.forIn(items, (item, key) => {
        item.source = key;
      })

      // Validate items.
      this.validateItems(items)

      // Iterate items object and add items to the items array for processing.
      .then(() => {
        _.forIn(items, (item, key) => {
          // If a hook is specified and item does not have that hook.
          if (hook && (!item.hasOwnProperty('hook') || item.hook !== hook)) {
            return;
          }

          if (type) {
            if (!item.hasOwnProperty('type')) {
              let source = path.join(this.project.directory, key);

              if (fs.existsSync(source)) {
                let type = 'file';

                if (fs.statSync(source).isDirectory()) {
                  type = 'dir';
                }

                item.type = type;
              }
              else {
                item.type = false;
              }
            }

            if (!item.type || item.type !== type) {
              return;
            }
          }

          // If item is not excluded, add to the array.
          if (itemsExcluded.indexOf(item.destination) === -1) {
            itemsArr.push(item);
          }
          // Otherwise skip it and inform the user.
          else {
            this.aquifer.console.log('Excluding: ' + key + ' => ' + item.destination);
          }
        })

        resolve(itemsArr);
      })

      // Report up the chain if there was a problem.
      .catch((reason) => {
        reject(reason);
      })
    });
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

  /**
   * Validates all sync items.
   * @param {object} items An object containing sync items to validate.
   * @returns {object} A promise object.
   */
  validateItems(items) {
    return new Promise((resolve, reject) => {
      let chain = [];
      _.forIn(items, (item, key) => {
        chain.push(this.validateItem(item, key));
      });
      Promise.all(chain)
      .then(() => {
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      })
    })
  }

  /**
   * Validates a sync item.
   * @param {object} item The item to validate.
   * @param {string} key The key of the sync item in aquifer.json.
   * @returns {object} A promise object.
   */
  validateItem(item, key) {
    return new Promise((resolve, reject) => {
      // item.source must exist and must not be falsey. item.destination must
      // exist, but it can be falsey. In the case it is an empty string it will cause the synced item to be placed in the build root.
      if (!item.hasOwnProperty('source') || !item.source || !item.hasOwnProperty('destination')) {
        reject('The "' + key + '" sync item is misonfigured. Check that it contains a destination property in aquifer.json.');
        return;
      }

      resolve();
    })
  }
}

module.exports = Sync;
