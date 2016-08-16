"use strict";

var clone = require('clone');
var extend = require('extend');
var fs = require('fs');
var gutil = require('gulp-util');
var homeConfig = require('home-config');
var path = require('path');
var request = require('request');
var syncRequest = require('sync-request');
var strformat = require('strformat');
var through = require("through2");


const PLUGIN_NAME = 'gulp-viewport-uploader';
const VIEWPORTRC = homeConfig.load('.viewportrc');

const THEME_BY_NAME_REST_URL = '/rest/scroll-viewport/1.0/theme?name={0}';
const UPDATE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resource';
const DELETE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resource';

const LOG_ENABLED = true;
const DEBUG_ENABLED = true;


var ViewportTheme = function (themeName, targetSystemKey, uploadOpts) {
    this.targetSystem = getTargetConfig(targetSystemKey);
    this.themeId = getThemeId(this.targetSystem, themeName);
    this.uploadOpts = uploadOpts;

    log();
    log('======================================================');
    log('   You are deploying \'' + themeName + '\'to:');
    log('   ' + this.targetSystem.confluenceBaseUrl);
    log('======================================================');
    log();

    function getTargetConfig(targetSystemKey) {
        if (!VIEWPORTRC.hasOwnProperty(targetSystemKey)) {
            throw new gutil.PluginError(PLUGIN_NAME, 'No configuration for target \'' + targetSystemKey + '\' found - check ~/.viewportrc.');
        } else {
            return VIEWPORTRC[targetSystemKey];
        }
    }

    function getThemeId(targetSystem, themeName) {
        var response = syncRequest('GET', strformat(targetSystem.confluenceBaseUrl + THEME_BY_NAME_REST_URL, themeName),
            {
                headers: {
                    'Authorization': ('Basic ' + new Buffer(targetSystem.username + ':' + targetSystem.password).toString('base64'))
                }
            });

        if (response.statusCode != 200) {
            throw new gutil.PluginError(PLUGIN_NAME, 'Theme \'' + themeName + '\' not found on \'' + targetSystem.confluenceBaseUrl +
                '\'! Create a new theme named exactly like this to fix.');
        }

        return JSON.parse(response.getBody('utf8')).id;
    }
};


function uploadPipeline(uploadOpts) {

    var that = this;

    // if we get upload opts here, clone existing and override
    uploadOpts = uploadOpts ?
        extend(clone(that.uploadOpts), uploadOpts) :
        that.uploadOpts;

    if (!this.themeId) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Missing options.themeId!');
    }

    if (!uploadOpts.sourceBase && !uploadOpts.targetPath) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Missing uploadOpts.sourceBase or uploadOpts.targetPath!');
    }

    // Creating a stream through which each file will pass
    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            // return empty file
            return cb(null, file);
        }

        uploadFile(file, that, uploadOpts);

        cb(null, file);
    });

}


function uploadFile(file, viewportTheme, uploadOpts) {
    if (!uploadOpts.targetPath) {
        var targetPath = path.relative(path.join(file.cwd, uploadOpts.sourceBase), file.history[file.history.length - 1]);
        targetPath = path.normalize(targetPath);
    } else {
        targetPath = uploadOpts.targetPath;
    }

    debug('Uploading \'' + file.history[0] + '\' to \'' + targetPath + '\'.');

    file.pipe(request({
        url: strformat(viewportTheme.targetSystem.confluenceBaseUrl + UPDATE_REST_URL, viewportTheme.themeId),
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': file.contents.length,
            'X-Scroll-Viewport-Resource-Location': targetPath,
            'Authorization': ('Basic ' + new Buffer(viewportTheme.targetSystem.username + ':' + viewportTheme.targetSystem.password).toString('base64'))
        }

    }, function (error, response) {
        if (response.statusCode === 201) {
            uploadOpts.success && uploadOpts.success(file, response);
            log('File \'' + JSON.parse(response.body).name + '\' successfully uploaded.');

        } else {
            uploadOpts.error && uploadOpts.error(file, response);
            log('Error while uploading file to \'' + targetSystem.confluenceBaseUrl + '\':\n' +
                response.statusCode + ' - ' + response.statusMessage);
        }
    }));

}


function extendUploadOpts(newUploadOpts) {
    extend(this.uploadOpts, newUploadOpts);
}


function removeAllResources(uploadOpts) {

    var that = this;

    // if we get upload opts here, clone existing and override
    uploadOpts = uploadOpts ?
        extend(clone(that.uploadOpts), uploadOpts) :
        that.uploadOpts;

    request({
        url: strformat(this.targetSystem.confluenceBaseUrl + DELETE_REST_URL, this.themeId),
        method: 'DELETE',
        headers: {
            'Authorization': ('Basic ' + new Buffer(this.targetSystem.username + ':' + this.targetSystem.password).toString('base64'))
        }
    }, function (error, response, body) {
        if (!error && response.statusCode == 204) {
            log('Resources succesfully removed.');
        } else {
            uploadOpts.error && uploadOpts.error(file, response);
            log('Error while removing resources:\n' +
                response.statusCode + ' - ' + response.statusMessage);
        }
    });
}


function log(msg, obj) {
    if (LOG_ENABLED) {
        if (msg) {
            console.log(msg + objAsString(obj));
        } else {
            console.log();
        }
    }
}


function objAsString(obj) {
    var dontLogContents = function (key, value) {
        if (key == '_contents') {
            return undefined;
        } else {
            return value;
        }
    };

    if (obj) {
        return ' ((' + JSON.stringify(obj, dontLogContents, 4) + '))';
    } else {
        return '';
    }
}


function debug(msg, obj) {
    if (DEBUG_ENABLED) {
        console.log(msg + objAsString(obj));
    }
}


ViewportTheme.prototype.upload = uploadPipeline;
ViewportTheme.prototype.extendUploadOpts = extendUploadOpts;
ViewportTheme.prototype.removeAllResources = removeAllResources;

module.exports = ViewportTheme;
