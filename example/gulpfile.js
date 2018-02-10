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
var gulpLess = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var gulpSourcemaps = require('gulp-sourcemaps');
var ViewportTheme = require('gulp-viewport');


// The target environment (as defined in ~/.viewportrc)
var TARGET = 'DEV';

var THEME_NAME = 'your-theme-name';

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
