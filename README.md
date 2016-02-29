# gulp-viewport

The Gulp plugin for Scroll Viewport uploads theme resources directly into Scroll Viewport.

This is useful, when developing a Scroll Viewport theme locally. In this case, a Gulp file 
can watch the resources, automatically upload the resources to Scroll Viewport, and even have 
for example BrowserSync to sync the browser.

## Set-up

Create a config file ``~/.viewportrc`` that contains a list of all themes you want to upload to.

    [DEV]
    confluenceBaseUrl=http://localhost:1990/confluence
    viewportUrl=http://localhost:1990/confluence/en
    username=admin
    password=admin
    # Theme "My Theme"
    themeId=C0A8B21601532D65BE2C643B2E3FB880
    
Each section in the file is represents a theme on a specific Confluence server, a so-called
"target". In the example above there is one target called "DEV".                                                                    

Then you can use the Gulp Viewport plugin in your gulp file.
 
 
### Upload all files in pipeline

The gulp-viewport plugin provides a special destination, that uploads a files in the 
pipeline to a target (that has been defined in the ~/.viewportrc file). 

    gulp.task('templates', function () {
        return gulp.src('assets/**/*.vm')
            .pipe(viewport.upload(TARGET, UPLOAD_OPTS))  // upload to viewport
            .pipe(gulp.dest('build/templates'));         // also copy to local 'build' folder
    }


### Upload preprocessed file(s)

Especially CSS and JS files usually need some batching, minification and other pre-processing.
Here is how to do it.

    gulp.task('less', function () {
        return gulp.src('assets/less/main.less')
            .pipe(gulpSourcemaps.init())
            .pipe(gulpLess())
            .pipe(minifyCss())
            .pipe(viewport.upload(TARGET, {
                targetPath: 'css/main.css',    // target destination of batched file
                success: browserSync.reload    
            }))
            .pipe(gulp.dest('build/css'));
    });


### Set-up BrowserSync

For development gulp-watch and BrowserSync is super handy.

To set up gulp-watch and BrowserSync:

    // Dependencies 
    var browserSync = require('browser-sync').create();
    [...]
    var viewport = require('gulp-viewport');

    // The target system needs to match with a section in .viewportrc
    var TARGET = 'DEV';
    
    // The default upload opts.
    var UPLOAD_OPTS = { sourceBase: 'assets' };
    
    gulp.task('watch', function () {
    
        // init browser sync.
        browserSync.init({
            open: false,
            proxy: viewport.getViewportUrl('DEV')   // the target needs to define a viewportUrl
        });
    
        // Override the UPLOAD_OPTS.
        UPLOAD_OPTS = extend(DEFAULT_UPLOAD_OPTS, {
            uploadOnlyUpdated: 'true',
            success: browserSync.reload
        });
    
        gulp.watch('assets/less/**.less', ['less']);
        gulp.watch('assets/**/*.vm', ['templates']);
        // ... create more watches for other file types here
    });


### Delete all files from theme

    gulp.task('js', function () {
        return gulp.src('assets/js/**/*.*')
            .pipe(viewport(defaultOpts))
            .pipe(gulp.dest('build/js'));
    });


## Known Issues

* Scroll Viewport does have a bug with multiple parallel uploads (https://k15t.jira.com/browse/VPRT-719).
* 

## Resources & Further Reading

The following resources have been used when creating the plugin:

* A general starter on Gulp plugins: https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md
* For the API of the file objects used here: https://github.com/wearefractal/vinyl
