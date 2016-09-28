// Example gulpfile.js:
//
// Configuration:
//   TARGET -- the target to deploy to
//
// Tasks:
//   upload -- full build & upload
//   reset-theme -- remove all files from theme
//   watch -- watch (to be used during development)

var browserSync = require('browser-sync').create();
var clone = require('clone');
var extend = require('extend');
var gulp = require('gulp');
var gulpLess = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var gulpSourcemaps = require('gulp-sourcemaps');
var ViewportTheme = require('gulp-viewport');


// The target system needs to match with a section in .viewportrc
var TARGET = 'DEV';

// The theme name as named in the viewport config
var THEME_NAME = 'k15t-doc-theme';

// The Viewport URL (for auto reload)
var VIEWPORT_URL = 'http://localhost:1990/confluence/path-prefix';


var viewportTheme = new ViewportTheme(THEME_NAME, TARGET, {
    sourceBase: 'src'
});


gulp.task('upload', ['fonts', 'img', 'js', 'less', 'templates']);


gulp.task('watch', function () {
    browserSync.init({
        proxy: VIEWPORT_URL
    });

    viewportTheme.extendUploadOpts({
        success: browserSync.reload
    });

    gulp.watch('src/assets/fonts/**/*', ['fonts']);
    gulp.watch('src/assets/img/**/*', ['img']);
    gulp.watch('src/assets/js/**/*', ['js']);
    gulp.watch('src/assets/less/**.less', ['less']);
    gulp.watch('src/**/*.vm', ['templates']);
});


gulp.task('fonts', function () {
    return gulp.src('src/assets/fonts/**/*.*')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/fonts'));
});


gulp.task('img', function () {
    return gulp.src('src/assets/img/**/*')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/img'));
});


gulp.task('js', function () {
    return gulp.src('src/assets/js/**/*.*')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/js'));
});


gulp.task('less', function () {
    return gulp.src('src/assets/less/main.less')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpLess())
        .pipe(minifyCss())
        .pipe(viewportTheme.upload({
            targetPath: 'css/main.css'
        }))
        .pipe(gulp.dest('build/css'));
});

gulp.task('css', function () {
    return gulp.src('src/assets/css/**/*.css')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/css'));
});


gulp.task('templates', function () {
    return gulp.src('src/**/*.vm')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build'));
});


gulp.task('reset-theme', function () {
    viewportTheme.removeAllResources();
});
