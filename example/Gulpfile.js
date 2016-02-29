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
var viewport = require('gulp-viewport');


// The target system needs to match with a section in .viewportrc
var TARGET = 'DEV';

// The default upload opts (all sources are assumed to be in a sub-folder 'assets').
var UPLOAD_OPTS = { sourceBase: 'assets' };


gulp.task('upload', ['fonts', 'img', 'js', 'less', 'templates']);


gulp.task('watch', function () {
    browserSync.init({
        open: false,
        //https: true,
        proxy: viewport.getViewportUrl(TARGET)
    });

    UPLOAD_OPTS = extend(UPLOAD_OPTS, {
        uploadOnlyUpdated: 'true',
        success: browserSync.reload
    });

    gulp.watch('assets/fonts/**/*', ['fonts']);
    gulp.watch('assets/img/**/*', ['img']);
    gulp.watch('assets/js/**/*', ['js']);
    gulp.watch('assets/less/**.less', ['less']);
    gulp.watch('assets/**/*.vm', ['templates']);
});


gulp.task('fonts', function () {
    return gulp.src('assets/fonts/**/*.*')
        .pipe(viewport.upload(TARGET, UPLOAD_OPTS))
        .pipe(gulp.dest('build/fonts'));
});


gulp.task('img', function () {
    return gulp.src('assets/img/**/*')
        .pipe(viewport.upload(TARGET, UPLOAD_OPTS))
        .pipe(gulp.dest('build/img'));
});


gulp.task('js', function () {
    return gulp.src('assets/js/**/*.*')
        .pipe(viewport.upload(TARGET, UPLOAD_OPTS))
        .pipe(gulp.dest('build/js'));
});


gulp.task('less', function () {
    return gulp.src('assets/less/main.less')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpLess())
        .pipe(minifyCss())
        .pipe(viewport.upload(TARGET, extend(clone(UPLOAD_OPTS), {
            targetPath: 'css/main.css'
        })))
        .pipe(gulp.dest('build/css'));
});


gulp.task('templates', function () {
    return gulp.src('assets/**/*.vm')
        .pipe(viewport.upload(TARGET, UPLOAD_OPTS))
        .pipe(gulp.dest('build'));
});


gulp.task('reset-theme', function () {
    viewport.removeAllResources(TARGET);
});
