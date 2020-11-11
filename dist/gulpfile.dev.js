"use strict";

// Sass configuration
var gulp = require('gulp');

var sass = require('gulp-sass');

gulp.task('sass', function (cb) {
  gulp.src('views/public/scss/*.scss').pipe(sass()).pipe(gulp.dest('views/public/css/'));
  cb();
});
gulp.task('default', gulp.series('sass', function (cb) {
  gulp.watch('views/public/scss/*.scss', gulp.series('sass'));
  cb();
}));