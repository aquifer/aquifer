/**
 * @file
 * This file defines the data model for a Aquifer project.
 */

/* globals require, module */

module.exports = function (Aquifer) {
  'use strict';

  /**
   * Defines the Project object.
   *
   * @param string directory working directory of package.
   */
  var Project = function(directory) {
    var self = this,
        fs = require('fs-extra'),
        path = require('path'),
        _ = require('lodash');


    self.directory = directory;
    self.paths = {
      json: path.join(self.directory, 'aquifer.json'),
      make: path.join(self.directory, 'drupal.make'),
      settings: path.join(self.directory, 'site.settings.php'),
      builds: path.join(self.directory, 'builds'),
      modules: path.join(self.directory, 'modules'),
      themes: path.join(self.directory, 'themes')
    };

    self.initialized = fs.existsSync(self.paths.make) ? true : false;
  }
};
