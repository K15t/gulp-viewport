"use strict";

var fs = require('fs');
var gutil = require('gulp-util');
var homeConfig = require('home-config');
var path = require('path');
var request = require('request');
var syncRequest = require('sync-request');
var strformat = require('strformat');
var through = require("through2");
var observable = require("riot-observable");
var slash = require("slash");

const PLUGIN_NAME = 'gulp-viewport';
const VIEWPORTRC = homeConfig.load('.viewportrc');

const THEME_BY_NAME_REST_URL = '/rest/scroll-viewport/1.0/theme?name={0}&scope={1}';
const CREATE_THEME_URL = '/rest/scroll-viewport/1.0/theme';
const UPDATE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resource';
const DELETE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resource';

module.exports = class ViewportTheme {
    constructor(options) {
        // allow events to be triggered and listened to
        observable(this);

        // Options are set via ENV variables, GULP Config and/or .viewportrc config
        const defaultOptions = {
            // If not existing, determine key using the id. one of the two has to exist
            themeName: process.env.VPRT_THEMENAME,
            // It is usually easier to use the themeName, but if needed - the id can be used.
            themeId: process.env.VPRT_THEMEID,
            // For home-config users of .viewportrc - defines which config to use for target
            env: process.env.VPRT_ENV,
            // If you want to use space admin permissions instead of global, set the space key here
            scope: process.env.VPRT_SCOPE,
            // If you do not want to use a .viewportrc file, you can manually pass the target opts
            target: {
                // https://example.com/confluence/
                confluenceBaseUrl: process.env.VPRT_CONFLUENCEBASEURL,
                // A user that is eligible to update viewport themes in the given space
                username: process.env.VPRT_USERNAME,
                password: process.env.VPRT_PASSWORD
            },
            // If the source is placed in a subfolder (dist/theme/...) use this path
            sourceBase: process.env.VPRT_SOURCEBASE,
            // If the source has to be placed somewhere else than /
            targetPath: process.env.VPRT_TARGETPATH
        };

        this.options = defaultOptions;
        this.options = this.extendOptions(options);

        // let's remove trailing slash, from Confluence base URL, if there is one
        this.options.target.confluenceBaseUrl = this.options.target.confluenceBaseUrl.replace(/\/$/, '');

        this.log(`${this.getUserAnnotation()} Changing theme ${gutil.colors.bold.yellow(this.options.themeName)} at ${gutil.colors.bold.green(this.options.target.confluenceBaseUrl)}`);
    }

    getUserAnnotation() {
        if (this.options.env) {
            return `${gutil.colors.yellow.bold(this.options.target.username + '@' + this.options.env)}`;
        } else if (this.options.target.confluenceBaseUrl) {
            return `${gutil.colors.yellow.bold(this.options.target.username)}`;
        }
    }

    extendOptions(options = {}) {
        let newOptions = {target:{}};
        if (options) {
            Object.assign(newOptions, this.options, options);
            if (options.target) {
                Object.assign(newOptions.target, this.options.target, options.target);
            }
            return this.validateOptions(newOptions);
        }
    }

    validateOptions(options) {
        if (options.env && VIEWPORTRC.hasOwnProperty(options.env)) {
            options.target = Object.assign({}, options.target, VIEWPORTRC[options.env])
        }
        if (!options.targetPath) {
            options.targetPath = './'
        }
        if (!options.sourceBase) {
            options.sourceBase = './'
        }
        if (!options.scope) {
            if (!options.target.scope) {
                options.scope = ''
            } else {
                options.scope = options.target.scope
            }
        }

        if (!(options.themeId || options.themeName)) {
            throw new gutil.PluginError(PLUGIN_NAME, 'themeName or themeId missing');
        }

        return options
    }

    getThemeId() {
        if (!this.options.themeId) {
            let response = syncRequest('GET', strformat(this.options.target.confluenceBaseUrl + THEME_BY_NAME_REST_URL, this.options.themeName, this.options.scope),
                {
                    headers: {
                        'Authorization': ('Basic ' + new Buffer(this.options.target.username + ':' + this.options.target.password).toString('base64'))
                    }
                }
            );

            this.checkForPermissionErrors(response);

            if (response.statusCode !== 200) {
                throw new gutil.PluginError(PLUGIN_NAME, 'Error finding theme \'' + this.options.themeName + '\' on \'' + this.options.target.confluenceBaseUrl +
                    '\': ' + response.statusCode + ' - ' + response.statusMessage)
            }

            this.options.themeId = JSON.parse(response.getBody('utf8')).id
        }

        return this.options.themeId;
    }


    checkForPermissionErrors(response) {
        if (response.statusCode === 401) {
            throw new gutil.PluginError(PLUGIN_NAME, `Authentication error (Scope: ${this.options.scope || 'GLOBAL'}). Make sure ${this.getUserAnnotation()} uses correct credentials.`);
        }
        if (response.statusCode === 403) {
            throw new gutil.PluginError(PLUGIN_NAME, `Permission error (Scope: ${this.options.scope || 'GLOBAL'}). Make sure ${this.getUserAnnotation()} has required permissions.`);
        }
    };


    exists() {
        this.log(`Checking if theme '${this.options.themeName}' exists...`);
        let response = syncRequest('GET', strformat(this.options.target.confluenceBaseUrl + THEME_BY_NAME_REST_URL, this.options.themeName, this.options.scope),
            {
                headers: {
                    'Authorization': ('Basic ' + new Buffer(this.options.target.username + ':' + this.options.target.password).toString('base64'))
                }
            });

        if (response.statusCode === 200) {
            return true;
        } else {

            this.checkForPermissionErrors(response);

            if (response.statusCode === 404) {
                // theme doesn't exist OR Scroll Viewport is not installed.
                // However, right now we can't differentiate the two at the moment.  :(
                return false;
            }

            return false;
        }
    };


    create() {
        this.log(`Creating theme '${this.options.themeName}'...`);

        let response = syncRequest('POST', strformat(this.options.target.confluenceBaseUrl + CREATE_THEME_URL),
            {
                headers: {
                    'Authorization': ('Basic ' + new Buffer(this.options.target.username + ':' + this.options.target.password).toString('base64'))
                },
                json: {
                    addStarterFiles: false,
                    name: this.options.themeName,
                    scope: this.options.scope
                }
            });

        this.checkForPermissionErrors(response);

        if (response.statusCode !== 200) {
            throw new gutil.PluginError(PLUGIN_NAME, 'Could not create \'' + this.options.themeName + '\' on \'' +
                this.options.target.confluenceBaseUrl + '\'! Make sure there is not already a theme with that name.');
        }
    };


    log(message) {
        // if we use the default console.log, objects and arrays are displayed nicely (though, wihout [plugin-name] branding)
        // we have this function, so we can still change it to our liking
        console.log(message)
    };


    error(message) {
        // if we use the default console.log, objects and arrays are displayed nicely (though, wihout [plugin-name] branding)
        // we have this function, so we can still change it to our liking
        console.error(message)
    };


    upload(options) {
        options = this.extendOptions(options);
        this.trigger('upload');
        let filesToUpload = [];
        return through.obj(
            (file, enc, cb) => {
                // If file exists, add it to our queue
                if (!file.isNull()) {
                    let sourceBase = slash(path.relative(options.sourceBase, file.history[0]));
                    let relativeSourceFilePath = slash(path.relative(process.cwd(), file.history[0]));
                    let sourceBasedFilePath = slash(path.relative(options.sourceBase, relativeSourceFilePath));
                    let targetPathFilePath = slash(path.relative(options.targetPath, sourceBasedFilePath));
                    let targetPathStart = slash(path.relative(process.cwd(), options.targetPath));

                    if (options.targetPath.match(/\.\w+?$/)) {
                        var targetPath = targetPathStart
                    } else {
                        var targetPath = targetPathFilePath
                    }

                    if (options.sourceBase.match(/\.\w+?$/)) {
                        var sourceBasePath = options.sourceBase
                    } else {
                        var sourceBasePath = relativeSourceFilePath
                    }

                    filesToUpload.push(
                        {
                            path: targetPath,
                            file: fs.createReadStream(sourceBasePath)
                        }
                    )
                }
                cb(null, file)
            },
            (cb) => {
                let files = filesToUpload.map(item=>item.file);
                let locations = filesToUpload.map(item=>item.path);
                request({
                    url: strformat(options.target.confluenceBaseUrl + UPDATE_REST_URL, this.getThemeId()),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': ('Basic ' + new Buffer(options.target.username + ':' + options.target.password).toString('base64'))
                    },
                    formData: { files, locations }
                }, (error, response) => {
                    if (error) {
                        console.log(error);
                        return
                    }
                    if (response.statusCode === 201) {
                        let uploadedFiles = JSON.parse(response.body);
                        uploadedFiles.map(item=>this.log(item));
                        this.log(`${uploadedFiles.length} Files ${gutil.colors.bold.green('successfully')} uploaded.`);
                        this.trigger('uploaded');
                    } else {
                        this.error('Error while uploading files: ' + response.statusCode + ' - ' + response.statusMessage);
                        this.trigger('error');
                    }
                    cb(null);
                })
            }
        )
    }

    removeAllResources() {
        this.trigger('remove');
        request({
            url: strformat(this.options.target.confluenceBaseUrl + DELETE_REST_URL, this.getThemeId()),
            method: 'DELETE',
            headers: {
                'Authorization': ('Basic ' + new Buffer(this.options.target.username + ':' + this.options.target.password).toString('base64'))
            }
        }, (error, response, body) => {
            if (!error && response.statusCode === 204) {
                this.log('Resources successfully removed.');
                this.trigger('removed');
            } else {
                this.log('Error while removing resources:\n' +
                response.statusCode + ' - ' + response.statusMessage);
                this.trigger('error');
            }
        })
    }

};
