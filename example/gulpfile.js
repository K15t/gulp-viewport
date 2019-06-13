// Example gulpfile.js
// IMPORTANT: Install all dependencies first (run npm install)
//
// Configuration:
//   TARGET -- the target to deploy to
//   THEME_NAME -- the name of the theme
//   BROWSERSYNC_URL -- the URL to be proxied by browser sync
//
// Tasks:
//   create -- create theme in Confluence (unless it exists)
//   upload -- full build & upload
//   reset-theme -- remove all files from theme
//   watch -- watch (to be used during development)

var browserSync = require('browser-sync').create();
var gulp = require('gulp');
var concat = require('gulp-concat');
var less = require('gulp-less');
var cleanCss = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var ViewportTheme = require('gulp-viewport');


// The target environment (as defined in ~/.viewportrc)
var TARGET = 'DEV';

// The scope (space) of the theme. Specify space key to install
// the theme into a space (empty string the theme will be global).
var SCOPE = '';

var THEME_NAME = 'your-theme-name';

// Enter Viewport URL here to enable browser sync, e.g.
// https://localhost:1990/confluence/test
var BROWSERSYNC_URL = '';


var viewportTheme = new ViewportTheme({
    env: TARGET,
    scope: SCOPE,
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
    if (BROWSERSYNC_URL !== '') {
        browserSync.init({
            proxy: BROWSERSYNC_URL
        });
        viewportTheme.on('uploaded', browserSync.reload);
    }

    gulp.watch('src/assets/fonts/**/*', ['fonts']);
    gulp.watch('src/assets/img/**/*', ['img']);
    gulp.watch('src/assets/scripts/**/*', ['scripts']);
    gulp.watch('src/assets/styles/**/*', ['styles']);
    gulp.watch('src/**/*.vm', ['templates']);
});


gulp.task('fonts', function () {
    return gulp.src('src/assets/fonts/**/*')
        .pipe(gulp.dest('build/fonts'))
        .pipe(viewportTheme.upload());
});


gulp.task('img', function () {
    return gulp.src('src/assets/img/**/*')
        .pipe(gulp.dest('build/img'))
        .pipe(viewportTheme.upload());
});


gulp.task('scripts', function () {
    return gulp.src('src/assets/scripts/**/*')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('build/js'))
        .pipe(viewportTheme.upload({
            sourceBase: 'build/js/main.js',
            targetPath: 'js/main.js'
        }));
});


gulp.task('styles', function () {
    return gulp.src('src/assets/styles/main.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(cleanCss())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/css'))
        .pipe(viewportTheme.upload({
            sourceBase: 'build/css/main.css',
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
