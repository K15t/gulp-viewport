# gulp-viewport

The Gulp plugin for Scroll Viewport uploads theme resources directly into Scroll Viewport.

This is useful, when developing a Scroll Viewport theme locally. In this case, a Gulp file 
can watch the resources, automatically upload the resources to Scroll Viewport, and have 
for example BrowserSync to sync the browser.

## Usage

```
gulp.task('js', function () {
    return gulp.src('assets/js/**/*.*')
        .pipe(viewport(defaultOpts))
        .pipe(gulp.dest('build/js'));
});
```

## Known Issues

Scroll Viewport does have a bug with multiple parallel uploads 
(https://k15t.jira.com/browse/VPRT-719). As a workaround, upload the theme initially by 
hand, and then enable the throttling in line 25.

## TODOs

* Keep the local folder completely in sync with the remote folder, i.e. not only handle file changed events but also added/deleted/moved.
* Use https://gist.github.com/xat/4b454edaf1949012ddee to work around the existing issues.

## Resources & Further Reading

The following resources have been used when creating the plugin:

* a general starter on gulp plugins: https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md
* for the API of the file objects used here: https://github.com/wearefractal/vinyl
