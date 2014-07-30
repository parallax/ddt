var gulp = require('gulp');
var tsc  = require('gulp-tsc');
var _    = require('lodash');
var shell = require('gulp-shell');

var options = {
    module        : 'amd',
    target        : 'ES5',
    noImplicitAny : true
};

gulp.task('compile-test', function() {
    return gulp.src(['./test/**/*.ts'])
        .pipe(tsc(options))
        .pipe(gulp.dest('.'));
});

gulp.task('compile', ['compile-test'], function() {
    return gulp.src(['./ddt.ts'])
        .pipe(tsc(_.extend(options, {
            declaration : true,
            sourcemap   : true,
            outDir      : '.'
        })))
        .pipe(gulp.dest('.'));
});

gulp.task('test', shell.task(['./node_modules/karma/bin/karma start']));
