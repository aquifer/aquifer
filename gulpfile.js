/**
 * @file
 * Gulp tasks for this project.
 */
/* globals require */

'use strict';

var gulp            = require('gulp'),
    eslint          = require('gulp-eslint'),
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
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(jscs());
});

/**
 * @task watch
 * Runs lint tasks when files are changed.
 */
gulp.task('watch', function() {
  gulp.watch(jsFilePatterns, ['lint']);
});
