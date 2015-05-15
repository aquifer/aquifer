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
          var symlinks = [],
              promises = [];

          // Add custom modules symlink.
          symlinks.push({
            src: self.project.absolutePaths.modules.custom,
            dest: path.join(self.destination, 'sites/all/modules/custom'),
            type: 'dir'
          });

          // Add features symlink.
          symlinks.push({
            src: self.project.absolutePaths.modules.features,
            dest: path.join(self.destination, 'sites/all/modules/features'),
            type: 'dir'
          });

          // Add custom themes symlink.
          symlinks.push({
            src: self.project.absolutePaths.themes.custom,
            dest: path.join(self.destination, 'sites/all/themes/custom'),
            type: 'dir'
          });

          // Add settings files symlinks.
          fs.readdirSync(self.project.absolutePaths.settings)
            .filter(function (file) {
              return file.indexOf('.') !== 0;
            })
            .forEach(function (file) {
              symlinks.push({
                src: path.join(self.project.absolutePaths.settings, file),
                dest: path.join(self.destination, 'sites/default', file),
                type: 'file'
              });
            });

          // Create a promise for each symlink creation.
          promises = symlinks.map(function (link) {
            var def = new Deferred();

            fs.symlink(link.src, link.dest, link.type, function (err) {
              if (err) {
                return def.reject(err);
              }
              def.resolve();
            });

            return def.promise;
          });

          // Return a promise for the completed creation of all symlinks.
          return promise.all(promises);
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
