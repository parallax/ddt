var gulp = require('gulp');
var tsc  = require('gulp-typescript-compiler');

var tscOptions = {
    module       : 'amd',
    target       : 'ES5',
    sourcemap    : false,
    logErrors    : true,
    comments     : true,
    resolve      : true
};

gulp.task('tsc-src', function() {

    return gulp.src(['./ddt.ts'])
        .pipe(tsc(tscOptions))
        .pipe(gulp.dest('.'));
});

gulp.task('tsc-test', function() {

    return gulp.src(['./test/**/*.ts'])
        .pipe(tsc(tscOptions))
        .pipe(gulp.dest('./test'));
});

gulp.task('tsc', ['tsc-src', 'tsc-test']);

gulp.task('build', ['tsc']);

gulp.task('watch', function() {
    gulp.watch(['./ddt.ts', './typings/**/*.ts'], ['tsc']);
});

gulp.task('default', ['tsc']);
