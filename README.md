# gulp-viewport

[![](https://img.shields.io/npm/v/gulp-viewport.svg)](https://www.npmjs.com/package/gulp-viewport) 
[![](https://img.shields.io/npm/dt/gulp-viewport.svg)](https://www.npmjs.com/package/gulp-viewport) 
[![](https://img.shields.io/twitter/follow/k15tsoftware.svg?style=social&label=Follow)](https://twitter.com/k15tsoftware)

<!-- toc orderedList:0 depthFrom:2 depthTo:6 -->

* [Install](#install)
* [Get started](#get-started)
* [Manual setup](#manual-setup)
* [Advanced Usage](#advanced-usage)
    * [Upload all files in a pipeline](#upload-all-files-in-a-pipeline)
    * [Upload preprocessed files](#upload-preprocessed-files)
    * [Set-up BrowserSync](#set-up-browsersync)
    * [Delete all files from theme](#delete-all-files-from-theme)
    * [Example gulpfile.js](#example-gulpfilejs)
* [Using gulp without a .viewportrc for CI server](#using-gulp-without-a-viewportrc-for-ci-server)
* [Known Limitations](#known-limitations)
* [Resources & Further Reading](#resources-further-reading)
* [Licensing](#licensing)

<!-- tocstop -->

The Gulp plugin for Scroll Viewport theme development uploads theme resources directly into Scroll Viewport.

This is useful, when developing a Scroll Viewport theme in a local IDE. In this case, Gulp can watch the resources, and automatically 
upload the build results into Scroll Viewport.


## Get started

The fastest way to get started with Gulp viewport is to use the Viewport Developer tools (available https://github.com/K15t/viewport-tools)
and start with a template project:

1. Install the Viewport Developer Tools: ``$ npm i -g viewport-tools``
1. Set up the URL and credentials for your Confluence development system: ``viewport init``
1. Create a new viewport theme project: ``viewport create``  
Select the 'Example Theme' in the third step.


## Manual Setup

### Create ~/.viewportrc

Create a config file `.viewportrc` in your home directory. This contains a list of all systems to which you want to upload your themes.

```yaml
[DEV]
confluenceBaseUrl=http://localhost:1990/confluence
username=admin
password=admin
```

Each section in the file is represents a Confluence server, also called **target system**.
In the example above there is one target system called **DEV**.

For advanced usage, please refer to the instructions below.


### Create a theme project with a Gulpfile.js

1. Install gulp-viewport as dev dependency:

        npm i -D gulp-viewport

1. Require gulp-viewport and create a ViewportTheme.

        var ViewportTheme = require('gulp-viewport');
        
        var viewportTheme = new ViewportTheme({
            themeName: 'your-theme',
            env: 'DEV' // taken from the ~/.viewportrc
        });

1. Create the Viewport theme in Confluence (since 2.3.0):

        gulp.task('create', function() {
            if(!viewportTheme.exists()) {
                viewportTheme.create();  // will create the theme in Confluence (global admin permissions required!)
            } else {
                console.log('Theme with name \'' + viewportTheme.themeName + '\' already exists.');
            }
        });

1. Upload your theme project

        gulp.task('upload', function () {
            return gulp.src('src/**/*')
                .pipe(viewportTheme.upload(
                    {
                        sourceBase: 'src',
                    }
                ))
        });


## Advanced Usage

Below is the full list of configuration options:

```js
var viewportTheme = new ViewportTheme({
    // name of the theme to upload to
    themeName: 'your-theme-name',
    // If you want to use space admin permissions instead of global, set the space key here
    scope: ,
    // For home-config users of .viewportrc - defines which config to use for target
    env: 'DEV',
    // If you want to set up your target via the gulpfile instead of a .viewportrc, use this.
    // Notice that you should NOT check in your credentials with git!
    // omit env, if you are using target.
    target: {
        // https://your-installation.com/confluence/
        confluenceBaseUrl: 'http://localhost:1990/confluence',
        // A user that is eligible to update viewport themes in the given space
        username: 'admin',
        password: 'admin',
    },
    // If the source is placed in a subfolder (dist/theme/...) use this path
    sourceBase: '',
    // If the source has to be placed somewhere else than /
    targetPath: '',
});
```

### Creating themes in a space (with space-admin-only permissions)

If you want to create a viewport theme in a specific scope (space), just set the scope on the theme as follows:

```js
var viewportTheme = new ViewportTheme({
    themeName: 'your-theme',
    env: 'DEV',    // taken from the ~/.viewportrc
    scope: 'TEST'  // space key
});

gulp.task('create', function() {
    if(!viewportTheme.exists()) {
        viewportTheme.create();  // will create a theme in the space with key 'test' (space admin permissions required!)
    } else {
        console.log('Theme with name \'' + THEME_NAME + '\' already exists.');
    }
});
```


### Targeting different environments

You may be deploying the theme to different environments (such as development or testing). To do so, you can configure different
environments in `~/.viewportrc` and use that configurations in your `gulpfile.js`.

This is how you can configure different target environments:

```yaml
[DEV]
confluenceBaseUrl=http://localhost:1990/confluence
username=admin
password=admin

[TEST]
confluenceBaseUrl=http://confluence-test.example.com
username=admin
password=admin
```

In the example above there are two target systems called **DEV** and **TEST**. Then you can use the Gulp Viewport plugin in your gulp 
file along with a command line parameter:

```js
var ViewportTheme = require('gulp-viewport');
var minimist = require('minimist');

var knownOptions = {
  string: 'env',
  default: { env: process.env.VPRT_ENV || 'DEV' }
};

var options = minimist(process.argv.slice(2), knownOptions);

var viewportTheme = new ViewportTheme({
    themeName: 'theme-name',
    env: options.env
});
```

Then you can pass the parameter on the gulp command line to specify the target system, or omit it to fallback to an environment variable 
or the default value:

```
gulp --env TEST
```

Note: It is even possible to specify a themeName and scope for the environment, if you may want to upload the theme with different
scopes (global or specific spaces) and/or names:

````
[DEV]
confluenceBaseUrl=http://localhost:1990/confluence
themeName=test-theme
scope=TEST
username=admin
password=admin

[PROD]
confluenceBaseUrl=http://confluence-test.example.com
themeName=docs-theme
scope=DOCS
username=spaceadmin
password=password
````

### sourceBase & targetPath

These two settings are special, as they give you control over where the source comes from, and where it belongs to.

**Example with single file**
We want to preprocess `src/less/main.less` and upload it to `css/main.css`
The setting would have to be the following:
```js
gulp.task('less', function () {
    return gulp.src('src/less/main.less')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpLess())
        .pipe(minifyCss())
        .pipe(gulp.dest('build/css'))
        .pipe(viewportTheme.upload(
            {
                sourceBase: 'build/css/main.css',
                targetPath: 'css/main.css'
            }
        ))
});
```

In this case, we change paths, so we have to set a new sourceBase.
If we just want different folders, but keep the extension and filename, you will use it like this:

**Example with multiple files**
Templates are in `src/main_theme/templates` and we want to upload to `/`

```js
gulp.task('less', function () {
    return gulp.src('src/main_theme/templates/**/*.vm')
        .pipe(viewportTheme.upload(
            {
                sourceBase: 'src/main_theme/templates',
            }
        ))
});
```

This rebases the path for all uploaded files to `/`. In this case, all uploaded files have `src/main_theme/templates` removed.

So with these two options, you can remove or extend the path.

### Upload all files in a pipeline

The gulp-viewport plugin provides a special destination, that uploads a files in the pipeline to a target (that has been defined in the `~/.viewportrc` file).

```js
gulp.task('templates', function () {
    return gulp.src('assets/**/*.vm')
        .pipe(viewportTheme.upload());    // upload to viewport theme
});
```

`viewportTheme.upload()` accepts options that can temporarily override the options for the upload. This is useful for setting `sourceBase` and `targetPath` on demand. **Note:** the options are reset to the initial ones, after each upload.

### Upload preprocessed files

Especially CSS and JS files usually need some batching, minification and other pre-processing.
Here is how to do it.

```js
gulp.task('less', function () {
    return gulp.src('assets/less/main.less')
        .pipe(gulpSourcemaps.init())
        .pipe(gulpLess())
        .pipe(minifyCss())
        .pipe(viewportTheme.upload({
            targetPath: 'css/main.css'    // target destination of batched file
        }));
});
```

### Set-up BrowserSync

For development gulp-watch and BrowserSync is super handy.

To set up gulp-watch and BrowserSync:
```js
// Dependencies
var browserSync = require('browser-sync').create();
// [...]
var ViewportTheme = require('gulp-viewport');


var viewportTheme = new ViewportTheme({
    themeName: 'theme-name',
    // The target system needs to match with a section in .viewportrc
    env: 'DEV',
    sourceBase: 'assets'
});

gulp.task('watch', function () {

    // init browser sync.
    browserSync.init({
        open: false,
        // the target needs to define a viewportUrl
        proxy: 'http://localhost:1990/confluence',
    });

    // Override the UPLOAD_OPTS to enable auto reload.
    viewportTheme.on('uploaded', browserSync.reload);

    gulp.watch('assets/less/**.less', ['less']);
    gulp.watch('assets/**/*.vm', ['templates']);
    // ... create more watches for other file types here
});
```

### Delete all files from theme
```js
gulp.task('reset-theme', function () {
    viewportTheme.removeAllResources();
});
```

### Example gulpfile.js

Checkout [example/gulpfile.js](example/gulpfile.js) for a full example gulpfile.
To use the example, you need to install the following dependencies:

```
npm i -S browser-sync clone extend gulp-less gulp-minify-css gulp-sourcemaps
```

## Using gulp without a .viewportrc for a CI server

For tools like Bitbucket pipelines, where you can't rely on a file `.viewportrc` sitting in your home, or need automated builds on a CI server, you can use the following `process.env` variables:

* VPRT_THEMENAME - `themeName`
* VPRT_THEMEID - `themeId`
* VPRT_SCOPE - `scope`
* VPRT_ENV - `env`
* VPRT_CONFLUENCEBASEURL - `target.confluenceBaseUrl`
* VPRT_USERNAME - `target.username`
* VPRT_PASSWORD - `target.password`
* VPRT_SOURCEBASE - `sourceBase`
* VPRT_TARGETPATH - `targetPath`

Same with the config for the gulpfile: you can omit `env` if you use `user`, `password` and `url`.

```
VPRT_THEMENAME=my-theme VPRT_USERNAME=user VPRT_PASSWORD=secret VPRT_CONFLUENCEBASEURL=https://your-confluence-installation.com gulp upload
```

Checkout [example/gulpfile.js](example/gulpfile.js) for a full example gulpfile. This example assumes theme source is found in a
src/ subdirectory. To start from an existing theme, download the theme jar and unpack into src/, e.g.:

```sh
cd example
mkdir src/
unzip -d src/ /tmp/scroll-webhelp-theme-2.4.3.jar
```

## Known Limitations

* Please make sure you have Scroll Viewport 2.7.1 or later installed, the Gulp plugin will not work with any version before that. If you 
look to support an older version, please install version 1.2.0 of the plugin 
([See readme 1.2.0]((https://github.com/K15t/gulp-viewport/blob/ba1c5bb0ff4d3b938ecca37e017c21bb833867a3/README.md))).
* If you move or delete files locally, gulp-viewport will not automatically delete or move in your Confluence. In order 
to reset a theme use `viewportTheme.removeAllResources()` to remove all files and then upload all files from scratch.


## Resources & Further Reading

The following resources have been used when creating the plugin:

* If you have any questions please join our mailing list and ask them there: https://groups.google.com/forum/#!forum/scroll-viewport-dev 
* A general starter on Gulp plugins: https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md
* For the API of the file objects used here: https://github.com/wearefractal/vinyl


## Licensing

MIT
