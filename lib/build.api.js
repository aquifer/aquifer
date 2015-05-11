/**
 * @file
 * Takes a project object, and creates a build from it.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Creates a build function on the project object.
   *
   * @param object project object of project that should be built.
   * @param string destination path to destination folder.
   */
  Aquifer.project.build = function(project, destination) {
    var self = this;

    self.destination = destination;

  };
}
