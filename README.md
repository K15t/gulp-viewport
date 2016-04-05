# gulp-viewport

The Gulp plugin for Scroll Viewport uploads theme resources directly into Scroll Viewport.

This is useful, when developing a Scroll Viewport theme locally. In this case, a Gulp file 
can watch the resources, automatically upload the resources to Scroll Viewport, and even have 
for example BrowserSync to sync the browser.

## Get started

Create a config file ``~/.viewportrc`` that contains a list of all systems to which you want
to upload theme.

    [DEV]
    confluenceBaseUrl=http://localhost:1990/confluence
    username=admin
    password=admin
    
Each section in the file is represents a Confluence server, also called "target system". 
In the example above there is one target system called "DEV".                                                                    

Then you can use the Gulp Viewport plugin in your gulp file like the following:

    var viewportTheme = new ViewportTheme('the-theme-name', 'DEV');
 
 
### Upload all files in pipeline

The gulp-viewport plugin provides a special destination, that uploads a files in the 
pipeline to a target (that has been defined in the ``~/.viewportrc`` file). 

    gulp.task('templates', function () {
        return gulp.src('assets/**/*.vm')
            .pipe(viewportTheme.upload())         // upload to viewport theme
            .pipe(gulp.dest('build/templates'));  // also copy to local 'build' folder
    }


### Upload preprocessed file(s)

Especially CSS and JS files usually need some batching, minification and other pre-processing.
Here is how to do it.

    gulp.task('less', function () {
        return gulp.src('assets/less/main.less')
            .pipe(gulpSourcemaps.init())
            .pipe(gulpLess())
            .pipe(minifyCss())
            .pipe(viewportTheme.upload(TARGET, {
                targetPath: 'css/main.css'    // target destination of batched file    
            }))
            .pipe(gulp.dest('build/css'));
    });


### Set-up BrowserSync

For development gulp-watch and BrowserSync is super handy.

To set up gulp-watch and BrowserSync:

    // Dependencies 
    var browserSync = require('browser-sync').create();
    [...]
    var ViewportTheme = require('gulp-viewport');

    // The target system needs to match with a section in .viewportrc
    var TARGET = 'DEV';
    
    var viewportTheme = new ViewportTheme('the-theme-name', TARGET, { sourceBase: 'assets' });
    
    gulp.task('watch', function () {
    
        // init browser sync.
        browserSync.init({
            open: false,
            proxy: 'http://localhost:1990/confluence/vsn',   // the target needs to define a viewportUrl
        });
    
        // Override the UPLOAD_OPTS.
        viewportTheme.extendUploadOpts({
            uploadOnlyUpdated: 'true',
            success: browserSync.reload
        });
    
        gulp.watch('assets/less/**.less', ['less']);
        gulp.watch('assets/**/*.vm', ['templates']);
        // ... create more watches for other file types here
    });


### Delete all files from theme

    gulp.task('reset-theme', function () {
        viewportTheme.removeAllResources();
    });

    
### Example gulpfile.js

Checkout ``example/gulpfile.js`` for a full example gulpfiles.


## Known Limitations

* Please make sure to upgrade to Scroll Viewport 2.3.1, the Gulp plugin will
  not work with any version before that.  
* When using the ``gulp-watch`` file that are deleted or move locally, will
  not automatically be deleted or moved in Confluence. In order to reset a theme
  use ``viewportTheme.removeAllResources()`` to remove all files and then 
  upload all files from scratch.


## Resources & Further Reading

The following resources have been used when creating the plugin:

* A general starter on Gulp plugins: https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md
* For the API of the file objects used here: https://github.com/wearefractal/vinyl


## Licensing

MIT
