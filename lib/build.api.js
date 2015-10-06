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
        Deferred  = promise.Deferred;

    // Set class properties.
    self.destination = destination;

    // Intelligently transform destination into an absolute path.
    if (path.resolve(self.destination) !== self.destination) {
      self.destination = path.join(Aquifer.project.directory, self.destination);
    }

    // Set default options.
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
     * @param {boolean} refreshLock If true, forces a build from the make file
     *   and regenerates the lock file.
     * @param {string} makeFile Absolute path to the make file.
     * @param {string|boolean} lockFile Absolute path to the lock file or false
     *   if lock file is set to false in aquifer.json.
     * @param {function} callback Called when process finishes executing or
     *   errors out.
     *
     * @returns {boolean} true if the build is created, false if it fails.
     */
    self.create = function (make, refreshLock, makeFile, lockFile, callback) {
      // Callback falls back to an empty function.
      callback = callback || function () {};

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
            case (refreshLock && lockFile !== false && lockExists):
              // Build from make file, and generate lock file.
              return drush.exec(['make', makeFile, '--lock=' + lockFile]);

            case make:
              // Build from make file, no lock file generation required.
              return drush.exec(['make', makeFile]);

            default:
              if (!lockFile) {
                // Build from make file.
                return drush.exec(['make', makeFile]);
              }
              else if (lockExists) {
                // Build from existing lock file.
                return drush.exec(['make', lockFile]);
              }
              else {
                // Build from make file, and generate lock file.
                return drush.exec(['make', makeFile, '--lock=' + lockFile]);
              }
          }
        }))
        // Set sites/default permissions correctly.
        .then(buildStep('Setting permissions on build files.', function () {
          fs.chmodSync(path.join(Aquifer.project.directory, 'files'), '755');
        }))
        // Create symlinks or copy.
        .then(buildStep(this.options.symlink ? 'Creating symlinks...' : 'Copying files and directories...', function () {
          var links     = [],
              promises  = [];

          // Installation profiles.
          if (Aquifer.project.config.paths.profiles) {
            Object.keys(Aquifer.project.config.paths.profiles).forEach(function(key) {
              links.push({
                src: Aquifer.project.config.paths.profiles[key],
                dest: 'profiles/' + key,
                type: 'dir'
              });
            });
          }

          // Add module links.
          Object.keys(Aquifer.project.config.paths.modules).forEach(function(key) {
            if (key !== 'root' && key !== 'contrib') {
              links.push({
                src: Aquifer.project.config.paths.modules[key],
                dest: 'sites/all/modules/' + key,
                type: 'dir'
              });
            }
          });

          // Add custom themes link.
          links.push({
            src: Aquifer.project.config.paths.themes.custom,
            dest: 'sites/all/themes/custom',
            type: 'dir'
          });

          // Add files link.
          links.push({
            src: Aquifer.project.config.paths.files.root,
            dest: 'sites/default/files',
            type: 'dir'
          });

          // Add settings files links.
          fs.readdirSync(Aquifer.project.absolutePaths.settings)
            .filter(function (file) {
              return file.indexOf('.') !== 0;
            })
            .forEach(function (file) {
              links.push({
                src: path.join(Aquifer.project.config.paths.settings, file),
                dest: path.join('sites/default', file),
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
                src: path.join(Aquifer.project.config.paths.root, file),
                dest: file,
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

            // Make src and dest paths absolute.
            link.dest = path.join(self.destination, link.dest);
            link.src = path.join(Aquifer.project.directory, link.src);

            // If symlinking is turned on, symlink custom files. Else, copy.
            if (self.options.symlink) {
              // Change current directory to the destination base path (minus last part of path).
              var destBase = path.dirname(link.dest);
              process.chdir(destBase);

              // Symlink the relative path of the src from the destination into the basename of the path.
              fs.symlink(path.relative(destBase, link.src), path.basename(link.dest), link.type, linkCallback);
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
