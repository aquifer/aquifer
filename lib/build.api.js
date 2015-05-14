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

      // Initialize drush and the build promise chain.
      drush.init()
        // Delete current build.
        .then(function () {
          var def = new Deferred();

          fs.remove(self.destination, function (err) {
            if (err) {
              return def.reject(err);
            }
            def.resolve();
          });
          return def.promise;
        })
        // Run drush make.
        .then(function () {
          return drush.exec('make ' + make + ' ' + self.destination);
        })
        // Create symlinks.
        .then(function () {
          var def       = new Deferred(),
              fsSuccess = function () {
                // We don't care what this returns so long as it returns something.
                return true;
              },
              fsError   = function (err) {
                // Reject the parent promise if any of the symlinks fail.
                def.reject(err);
              },
              symlinks  = promise.all([
                promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.settings, path.join(self.destination, 'sites/default/site.settings.php'), 'file'), fsSuccess, fsError),
                promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.modules.custom, path.join(self.destination, 'sites/all/modules/custom'),  'dir'), fsSuccess, fsError),
                promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.modules.features, path.join(self.destination, 'sites/all/modules/features'),  'dir'), fsSuccess, fsError),
                promise.whenPromise(fs.symlinkSync(self.project.absolutePaths.themes.custom, path.join(self.destination, 'sites/all/themes/custom'),  'dir'), fsSuccess, fsError)
              ]);

          symlinks.then(function (res) {
            def.resolve();
          });

          return def.promise;
        })
        // Complete the build promise chain.
        .then(callback, function (err) {
          Aquifer.console.log(err, 'error');
        });
    };
  };

  return Build;
};
