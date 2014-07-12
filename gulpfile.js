var gulp = require('gulp');
var tsc  = require('gulp-typescript-compiler');

gulp.task('tsc', function() {

    return gulp.src('./ddt.ts')
        .pipe(tsc({
            module    : 'amd',
            target    : 'ES5',
            sourcemap : false,
            logErrors : true,
            comments  : true,
            resolve   : true
        }))
        .pipe(gulp.dest('.'));
});

gulp.task('build', ['tsc']);

gulp.task('watch', function() {
    gulp.watch(['./ddt.ts', './typings/**/*.ts'], ['tsc']);
});

gulp.task('default', ['tsc']);