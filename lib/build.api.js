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
   * @param {object} options configuration options for the build.
   *
   * @returns {object} instance of Build object.
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
     * @param {string} make string representing absolute path to makefile.
     * @param {function} callback called when process finishes executing or errors out.
     *
     * @returns {booleans} true if the build is created, false if it fails.
     */
    self.create = function (make, callback) {
      // If project isn't initialized (doesn't exist) then exit.
      if (!Aquifer.initialized) {
        callback('Cannot build a project that hasn\'t been initialized.');
        return false;
      }

      var buildStep, jsonObjToPhpArray, renderPhpVar;

      /**
       * Wrap any operation in a chainable promise.
       *
       * @param {string} message string to log to the console before completing this step.
       * @param {function} action the operation to be performed.
       *
       * @returns {function} chaiable promise.
       */
      buildStep = function (message, action) {
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

      // If the destination does not exist (was deleted or first build) create it.
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
          return drush.exec(['make', make]);
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
