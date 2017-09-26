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

// var browserSync = require('browser-sync').create();
var clone = require('clone');
var extend = require('extend');
var gulp = require('gulp');
var gulpLess = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var gulpSourcemaps = require('gulp-sourcemaps');
var ViewportTheme = require('gulp-viewport');


// The target system needs to match with a section in .viewportrc
// We recommend to use a .viewportrc move password and username credentials away from this file
// You should never check in your credentials to your codebase.
// var TARGET = 'DEV';

// Create a theme in your Viewport with the exact same name.
var THEME_NAME = 'webhelp-theme';

// The url to your viewport, if you use browsersync.
// A tool to automatically refresh the browser when watching files. See https://www.browsersync.io/
// var BROWSERSYNC_URL = 'http://localhost:8090';


var viewportTheme = new ViewportTheme({
    //env: TARGET,
    themeName: THEME_NAME,
    target : {
        // PLEASE NOTE!
        // We highly recommend to use the env: TARGET setting
        // You can however use username and password here directly to start quickly.
        // How to use env is explained here: https://github.com/K15t/gulp-viewport#get-started
        confluenceBaseUrl: 'localhost:8090',
        username: 'admin',
        password: 'admin'
    }
    sourceBase: 'src'
});


gulp.task('upload', ['reset-theme', 'fonts', 'img', 'js', 'css', 'less', 'templates']);


gulp.task('watch', function () {
    // browserSync.init({
    //     proxy: BROWSERSYNC_URL
    // });

    viewportTheme.on('uploaded', browserSync.reload);

    gulp.watch('src/assets/fonts/**/*', ['fonts']);
    gulp.watch('src/assets/img/**/*', ['img']);
    gulp.watch('src/assets/js/**/*', ['js']);
    gulp.watch('src/assets/css/**.css', ['css']);
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
        .pipe(gulp.dest('build/css'))
        .pipe(viewportTheme.upload({sourceBase: 'build/css/main.css', targetPath: 'assets/css/main.css'}))
});

gulp.task('css', function () {
    return gulp.src('src/assets/css/**/*.css')
        .pipe(minifyCss())
        .pipe(viewportTheme.upload());
});

gulp.task('templates', function () {
    return gulp.src('src/**/*.vm')
        .pipe(viewportTheme.upload())
        .pipe(gulp.dest('build'));
});


gulp.task('reset-theme', function () {
    viewportTheme.removeAllResources();
});
