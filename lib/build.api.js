/**
 * @file
 * Takes a project object, and creates a build from it.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Creates a build object from which operations can be initiated.
   *
   * @param {string} destination Path to destination folder.
   * @param {object} options Configuration options for the build.
   *
   * @returns {object} Instance of Build object.
   */
  var Build = function (destination, options) {
    var self      = this,
        _         = require('lodash'),
        fs        = require('fs-extra'),
        del       = require('del'),
        path      = require('path'),
        drush     = require('drush-node'),
        promise   = require('promised-io/promise'),
        nconf     = require('nconf').argv().env().file(path.join(Aquifer.projectDir, 'aquifer.secrets.json')),
        Deferred  = promise.Deferred;

    self.destination = destination;

    self.options = {
      symlink: true,
      delPatterns: ['*']
    };

    if (options) {
      _.assign(self.options, options);
    }

    /**
     * Creates a Drupal root in specified directory.
     *
     * @param {boolean} make If true, forces a build from the make file.
     * @param {boolean} lock If true, forces a build from the lock file if one
     *   exists (same as default behavior). If used in combination with make,
     *   lock file will be rebuilt from make file.
     * @param {string} makeFile Absolute path to the make file.
     *   @param {string|boolean} lockFile Absolute path to the lock file or false
     *   if lock file is set to false in aquifer.json.
     * @param {function} callback Called when process finishes executing or
     *   errors out.
     *
     * @returns {boolean} true if the build is created, false if it fails.
     */
    self.create = function (make, resetLock, makeFile, lockFile, callback) {
      // If project isn't initialized (doesn't exist) then exit.
      if (!Aquifer.initialized) {
        callback('Cannot build a project that hasn\'t been initialized.');
        return false;
      }

      // Make sure the make file exists.
      try {
        fs.statSync(makeFile);
      }
      // If there was an exception, the make file probably doesn't exist.
      catch (error) {
        Aquifer.console.log(error, 'error');
        return;
      }

      /**
       * Wrap any operation in a chainable promise.
       *
       * @param {string} message String to log to the console before completing
       *   this step.
       * @param {function} action The operation to be performed.
       *
       * @returns {function} chaiable promise.
       */
      var buildStep = function (message, action) {
        return function() {
          var def = new Deferred();

          // Log the message.
          Aquifer.console.log(message, 'status');

          // Perform the action.
          promise.when(action(), function (res) {
            def.resolve(res);
          },
          function (err) {
            def.reject(err);
          });

          return def.promise;
        };
      };

      // If the destination does not exist (was deleted or first build) create
      // it.
      if (!fs.existsSync(self.destination)) {
        fs.mkdirSync(self.destination);
      }

      // Initialize drush and the build promise chain.
      drush.init({log: true, cwd: self.destination})
        // Delete current build.
        .then(buildStep('Removing possible existing build...', function () {
          del(self.options.delPatterns, {cwd: self.destination});
        }))
        // Run drush make.
        .then(buildStep('Executing drush make...', function () {
          var lockExists = false;

          // Should we check for the existence of a lock file?
          if (lockFile) {
            // Make sure the lock file exists.
            try {
              fs.statSync(lockFile);
              lockExists = true;
            }
            // If there was an exception, the lock file probably doesn't exist.
            catch (error) {
              lockExists = false;
            }
          }

          switch (true) {
            case resetLock:
              // Build from make file, and generate lock file.
              return drush.exec(['make', makeFile, '--lock=' + lockFile]);

            case make:
              // Build from make file, no lock file generation required.
              return drush.exec(['make', makeFile]);

            default:
              if (lockExists) {
                // Build from existing lock file.
                return drush.exec(['make', lockFile]);
              }
              else {
                // Build from make file, and generate lock file.
                return drush.exec(['make', makeFile, '--lock=' + lockFile]);
              }
          }
        }))
        // Create symlinks or copy.
        .then(buildStep(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...', function () {
          var links     = [],
              promises  = [];

          // Add custom modules link.
          links.push({
            src: Aquifer.project.absolutePaths.modules.custom,
            dest: path.join(self.destination, 'sites/all/modules/custom'),
            type: 'dir'
          });

          // Add features link.
          links.push({
            src: Aquifer.project.absolutePaths.modules.features,
            dest: path.join(self.destination, 'sites/all/modules/features'),
            type: 'dir'
          });

          // Add custom themes link.
          links.push({
            src: Aquifer.project.absolutePaths.themes.custom,
            dest: path.join(self.destination, 'sites/all/themes/custom'),
            type: 'dir'
          });

          // Add settings files links.
          fs.readdirSync(Aquifer.project.absolutePaths.settings)
            .filter(function (file) {
              return file.indexOf('.') !== 0;
            })
            .forEach(function (file) {
              links.push({
                src: path.join(Aquifer.project.absolutePaths.settings, file),
                dest: path.join(self.destination, 'sites/default', file),
                type: 'file'
              });
            });

          // Add core file overrides.
          fs.readdirSync(Aquifer.project.absolutePaths.root)
            .filter(function (file) {
              return file.indexOf('.git') !== 0;
            })
            .forEach(function (file) {
              // Delete existing files.
              fs.unlinkSync(path.join(self.destination, file));

              links.push({
                src: path.join(Aquifer.project.absolutePaths.root, file),
                dest: path.join(self.destination, file),
                type: 'file'
              });
            });

          // Create a promise for each link creation.
          promises = links.map(function (link) {
            var def           = new Deferred(),
                linkCallback  = function (err) {
                  if (err) {
                    return def.reject(err);
                  }
                  def.resolve();
                };

            if (self.options.symlink) {
              fs.symlink(link.src, link.dest, link.type, linkCallback);
            }
            else {
              fs.copy(link.src, link.dest, linkCallback);
            }

            return def.promise;
          });

          // Return a promise for the completed creation of all links.
          return promise.all(promises);
        }))
        // Complete the build promise chain.
        .then(function (res) {
          callback();
        }, function (err) {
          callback(err);
        });
    };

    return self;
  };

  return Build;
};
