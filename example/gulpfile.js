// Example gulpfile.js
// install all dependencies first (run npm install)
//
// Configuration:
//   TARGET -- the target to deploy to
//
// Tasks:
//   upload -- full build & upload
//   reset-theme -- remove all files from theme
//   watch -- watch (to be used during development)

var browserSync = require('browser-sync').create();
var gulp = require('gulp');
var gulpLess = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var gulpSourcemaps = require('gulp-sourcemaps');
var ViewportTheme = require('gulp-viewport');


// The target system needs to match with a section in .viewportrc
// How to use the different environments within the .viewportrc file is explained here: https://github.com/K15t/gulp-viewport#get-started
var TARGET = 'DEV';

// !! Create Theme in Viewport !!
// Before you can upload your theme there must be a Viewport theme with the exact same name like this THEME_NAME
var THEME_NAME = 'your-theme-name';

// The url to your viewport, if you use browsersync.
// A tool to automatically refresh the browser when watching files. See https://www.browsersync.io/
var BROWSERSYNC_URL = 'http://localhost:1990/confluence';

var viewportTheme = new ViewportTheme({
    env: TARGET,
    themeName: THEME_NAME,
    sourceBase: 'src'
});


gulp.task('upload', ['reset-theme', 'fonts', 'img', 'scripts', 'styles', 'templates']);


gulp.task('create', function() {
    if(!viewportTheme.exists()) {
        viewportTheme.create();
    } else {
        console.log('Theme with name \'' + THEME_NAME + '\' already exists.');
    }
});

// added upload as dependency to upload everything before we start to watch.
gulp.task('watch', ['upload'] , function () {
    browserSync.init({
        proxy: BROWSERSYNC_URL
    });

    viewportTheme.on('uploaded', browserSync.reload);

    gulp.watch('src/assets/fonts/**/*', ['fonts']);
    gulp.watch('src/assets/img/**/*', ['img']);
    gulp.watch('src/assets/scripts/**/*', ['scripts']);
    gulp.watch('src/assets/styles/**/*', ['styles']);
    gulp.watch('src/**/*.vm', ['templates']);
});


gulp.task('fonts', function () {
    return gulp.src('src/assets/fonts/**/*')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/fonts'));
});


gulp.task('img', function () {
    return gulp.src('src/assets/img/**/*')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build/img'));
});


gulp.task('scripts', function () {
    return gulp.src('src/assets/scripts/**/*')
        .pipe(viewportTheme.upload({
            sourceBase: 'src/assets'
        }))
        .pipe(gulp.dest('build/js'));
});


gulp.task('styles', function () {
    return gulp.src('src/assets/styles/main.less')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpLess())
        .pipe(minifyCss())
        .pipe(gulp.dest('build/styles'))
        .pipe(viewportTheme.upload({
            sourceBase: 'build/styles/main.css', 
            targetPath: 'css/main.css'
        }));
});

gulp.task('templates', function () {
    return gulp.src('src/**/*.vm')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build'));
});


gulp.task('reset-theme', function () {
    viewportTheme.removeAllResources();
});
