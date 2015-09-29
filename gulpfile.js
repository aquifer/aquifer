/**
 * @file
 * Gulp tasks for this project.
 */
/* globals require */

'use strict';

var gulp            = require('gulp'),
    eslint          = require('gulp-eslint'),
    jscs            = require('gulp-jscs'),
    bump            = require('gulp-bump'),
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

/**
 * @task bump-prerelease
 *   Increment Aquifer's prerelease version by 1.
 */
gulp.task('bump-prerelease', function(){
  gulp.src('./package.json')
  .pipe(bump({type: 'prerelease'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-patch
 *   Increment Aquifer's patch version by 1.
 */
gulp.task('bump-patch', function(){
  gulp.src('./package.json')
  .pipe(bump({type: 'patch'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-minor
 *   Increment Aquifer's minor version by 1.
 */
gulp.task('bump-minor', function(){
  gulp.src('./package.json')
  .pipe(bump({type: 'minor'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-major
 *   Increment Aquifer's major version by 1.
 */
gulp.task('bump-major', function(){
  gulp.src('./package.json')
  .pipe(bump({type: 'major'}))
  .pipe(gulp.dest('./'));
});
