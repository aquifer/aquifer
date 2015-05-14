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
   * @param object project object of project that should be built.
   * @param string destination path to destination folder.
   */
  var Build = function(project, destination) {
    var self      = this,
        fs        = require('fs-extra'),
        path      = require('path'),
        drush     = require('drush-node'),
        promise   = require('promised-io/promise'),
        Deferred  = promise.Deferred,
        q         = require('q');

    self.destination = destination;
    self.project = project;

    /**
     * Creates a Drupal root in specified directory.
     *
     * @param string make string representing absolute path to makefile.
     * @param funciton callback called when process finishes executing or errors out.
     */
    self.create = function (make, callback) {
      // If project isn't initialized (doesn't exist) then exit.
      if (!Aquifer.initialized) {
        callback('Cannot build a project that hasn\'t been initialized.');
        return;
      }

      /**
       * Wrap any operation in a chainable promise.
       *
       * @param string message string to log to the console before completing this step.
       * @param function action the operation to be performed.
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

      // Initialize drush and the build promise chain.
      drush.init()
        // Delete current build.
        .then(buildStep('Removing possible existing build...', function () {
          fs.removeSync(self.destination);
        }))
        // Run drush make.
        .then(buildStep('Executing drush make...', function () {
          return drush.exec('make ' + make + ' ' + self.destination);
        }))
        // Create symlinks.
        .then(buildStep('Creating symlinks...', function () {
          return promise.all([
            promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.settings, path.join(self.destination, 'sites/default/site.settings.php'), 'file')),
            promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.modules.custom, path.join(self.destination, 'sites/all/modules/custom'),  'dir')),
            promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.modules.features, path.join(self.destination, 'sites/all/modules/features'),  'dir')),
            promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.themes.custom, path.join(self.destination, 'sites/all/themes/custom'),  'dir'))
          ]);
        }))
        // Complete the build promise chain.
        .then(function (res) {
          callback();
        }, function (err) {
          callback(err);
        });
    };
  };

  return Build;
};
