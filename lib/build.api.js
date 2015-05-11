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
    var self = this,
        fs = require('fs-extra'),
        path = require('path'),
        drush = require('drush-node'),
        promise = require('promised-io/promise'),
        exec = require('child_process').exec;

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
      if (!self.project.initialized) {
        callback('Cannot build a project that hasn\'t been initialized.');
        return;
      }

      // Create directory in which Drupal will be built.
      drush.init().then(function() {
        var group = promise.all([
          drush.exec('make ' + make + ' ' + self.destination)
        ]);
      });
    }

  };

  return Build;
}
