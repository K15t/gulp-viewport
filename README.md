# gulp-viewport

[![](https://img.shields.io/npm/v/gulp-viewport.svg)](https://www.npmjs.com/package/gulp-viewport) [![](https://img.shields.io/npm/dt/gulp-viewport.svg)](https://www.npmjs.com/package/gulp-viewport) [![](https://img.shields.io/twitter/follow/k15tsoftware.svg?style=social&label=Follow)](https://twitter.com/k15tsoftware)

<!-- toc orderedList:0 depthFrom:2 depthTo:6 -->

* [Get started](#get-started)
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

The Gulp plugin for Scroll Viewport uploads theme resources directly into Scroll Viewport.

This is useful, when developing a Scroll Viewport theme in a local IDE. In this case, a Gulp file can watch the resources, automatically upload the resources to Scroll Viewport, and even have for example BrowserSync to sync the browser.

Looking for the old version documentation? [See readme for 1.2.0](https://github.com/K15t/gulp-viewport/blob/ba1c5bb0ff4d3b938ecca37e017c21bb833867a3/README.md).

## Get started

Create a config file `~/.viewportrc` that contains a list of all systems to which you want to upload theme.

```yaml
[DEV]
confluenceBaseUrl=http://localhost:1990/confluence
username=admin
password=admin
```

Each section in the file is represents a Confluence server, also called **target system**.
In the example above there is one target system called **DEV**.

Then you can use the Gulp Viewport plugin in your gulp file like the following:

```js
var ViewportTheme = require('gulp-viewport');

var viewportTheme = new ViewportTheme({
    themeName: 'your-theme',
    // target system
    env: 'DEV'
});
```

Below is the full list of configuration options:

```js
var viewportTheme = new ViewportTheme({
    // name of the theme to upload to
    themeName: 'your-theme-name',
    // For home-config users of .viewportrc - defines which config to use for target
    env: 'DEV',
    // If you want to set up your target via the gulpfile instead of a .viewportrc, use this.
    // Notice that you should NOT check in your credentials with git!
    // omit env, if you are using target.
    target: {
        // https://your-installation.com/confluence/
        confluenceBaseUrl: ,
        // A user that is eligible to update viewport themes in the given space
        username: ,
        password: ,
    },
    // If the source is placed in a subfolder (dist/theme/...) use this path
    sourceBase: ,
    // If the source has to be placed somewhere else than /
    targetPath: ,
});
```

### Upload all files in a pipeline

The gulp-viewport plugin provides a special destination, that uploads a files in the pipeline to a target (that has been defined in the `~/.viewportrc` file).

```js
gulp.task('templates', function () {
    return gulp.src('assets/**/*.vm')
        .pipe(viewportTheme.upload());    // upload to viewport theme
});
```

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

Checkout [example/gulpfile.js](example/gulpfile.js) for a full example gulpfiles.

## Using gulp without a .viewportrc for CI server

For tools like Bitbucket pipelines, where you can't rely on a file `.viewportrc` sitting in your home, or need automated builds on a CI server, you can use the following `process.env` variables:

* VPRT_THEMENAME - `themeName`
* VPRT_THEMEID - `themeId`
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

Checkout ``example/gulpfile.js`` for a full example gulpfile. This example assumes theme source is found in a
src/ subdirectory. To start from an existing theme, download the theme jar and unpack into src/, e.g.:

cd example
mkdir src/
unzip -d src/ /tmp/scroll-webhelp-theme-2.4.3.jar

## Known Limitations

* Please make sure to upgrade to Scroll Viewport 2.7.1, the Gulp plugin will not work with any version before that. If you look to support an older version, make sure to install 1.2.0 of the plugin ([See readme 1.2.0]((https://github.com/K15t/gulp-viewport/blob/ba1c5bb0ff4d3b938ecca37e017c21bb833867a3/README.md))).
* When using the `gulp-watch` files that are deleted or moved locally, will not automatically be deleted or moved in Confluence. In order to reset a theme use `viewportTheme.removeAllResources()` to remove all files and then upload all files from scratch.


## Resources & Further Reading

The following resources have been used when creating the plugin:

* A general starter on Gulp plugins: https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md
* For the API of the file objects used here: https://github.com/wearefractal/vinyl


## Licensing

MIT
