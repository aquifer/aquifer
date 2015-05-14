/**
 * @file
 * Gulp tasks for this project.
 */
/* globals require */

'use strict';

var gulp            = require('gulp'),
    jshint          = require('gulp-jshint'),
    jscs            = require('gulp-jscs'),
    jsFilePatterns  = [
      'index.js',
      'lib/*.js',
      'lib/**/*.js'
    ];

/**
 * @task lint
 *   Runs JSCS and JSLint on module, theme, and gulp files. Excludes all
 *   minified JavaScript files.
 */
gulp.task('lint', function () {
  return gulp.src(jsFilePatterns)
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(jscs());
});

/**
 * @task watch
 * Runs lint tasks when files are changed.
 */
gulp.task('watch', function() {
  gulp.watch(jsFilePatterns, ['lint']);
});
