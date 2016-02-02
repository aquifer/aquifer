/**
 * @file
 * Gulp tasks for this project.
 */
'use strict';

const gulp   = require('gulp');
const eslint = require('gulp-eslint');
const bump   = require('gulp-bump');
const jsFilePatterns  = [
  'gulpfile.js',
  'bin/*.js',
  'lib/*.js',
  'lib/**/*.js'
];

/**
 * @task lint
 *   Runs JSCS and JSLint on module, theme, and gulp files. Excludes all
 *   minified JavaScript files.
 */
gulp.task('lint', () => {
  return gulp.src(jsFilePatterns)
  .pipe(eslint())
  .pipe(eslint.format())
});

/**
 * @task watch
 * Runs lint tasks when files are changed.
 */
gulp.task('watch', () => {
  gulp.watch(jsFilePatterns, ['lint']);
});

/**
 * @task bump-prerelease
 *   Increment Aquifer's prerelease version by 1.
 */
gulp.task('bump-prerelease', () => {
  gulp.src('./package.json')
  .pipe(bump({type: 'prerelease'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-patch
 *   Increment Aquifer's patch version by 1.
 */
gulp.task('bump-patch', () => {
  gulp.src('./package.json')
  .pipe(bump({type: 'patch'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-minor
 *   Increment Aquifer's minor version by 1.
 */
gulp.task('bump-minor', () => {
  gulp.src('./package.json')
  .pipe(bump({type: 'minor'}))
  .pipe(gulp.dest('./'));
});

/**
 * @task bump-major
 *   Increment Aquifer's major version by 1.
 */
gulp.task('bump-major', () => {
  gulp.src('./package.json')
  .pipe(bump({type: 'major'}))
  .pipe(gulp.dest('./'));
});
