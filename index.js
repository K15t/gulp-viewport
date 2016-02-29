"use strict";

var clone = require('clone');
var extend = require('extend');
var fs = require('fs');
var gutil = require('gulp-util');
var homeConfig = require('home-config');
var path = require('path');
var request = require('request');
var strformat = require('strformat');
var through = require("through2");


const PLUGIN_NAME = 'gulp-viewport-uploader';
const RC_FILENAME = '.viewportrc';

const LOG_ENABLED = true;
const DEBUG_ENABLED = false;

const UPDATE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resource';
const DELETE_REST_URL = '/rest/scroll-viewport/1.0/theme/{0}/resources';


function log(msg, obj) {
    if (LOG_ENABLED) {
        console.log(msg + objAsString(obj));
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


function uploadPipeline(target, opts) {

    var options = extend(true, getTargetConfig(target), opts);

    if (!options.themeId) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Missing options.themeId!');
    }

    if (!options.sourceBase && !options.targetPath) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Missing options.sourceBase or options.targetPath!');
    }

    // Creating a stream through which each file will pass
    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            // return empty file
            return cb(null, file);
        }

        var isOriginalUpdated = function (file) {
            return (file.stat.atime.getTime() === file.stat.mtime.getTime())
        };

        var hasHistory = function (file) {
            return (file.history.length > 1);
        };

        if (!opts.uploadOnlyUpdated || isOriginalUpdated(file) || hasHistory(file)) {
            uploadFile(file, options);
        } else {
            debug('NOT uploading ' + file.history[0]);
        }

        cb(null, file);
    });

}


function getTargetConfig(target) {
    if (!homeConfig.load(RC_FILENAME).hasOwnProperty(target)) {
        throw new gutil.PluginError(PLUGIN_NAME, 'No configuration for target \'' + target + '\' found - check ~/.viewportrc.');
    } else {
        return homeConfig.load(RC_FILENAME)[target];
    }
}


function uploadFile(file, opts) {
    var options = opts;

    if (!options.targetPath) {
        var targetPath = path.relative(path.join(file.cwd, options.sourceBase), file.history[file.history.length - 1]);
        targetPath = path.normalize(targetPath);
    } else {
        targetPath = options.targetPath;
    }

    debug('Uploading \'' + file.history[0] + '\' to \'' + targetPath + '\'.');

    file.pipe(request({
        url: strformat(options.confluenceBaseUrl + UPDATE_REST_URL, options.themeId),
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': file.contents.length,
            'X-Scroll-Viewport-Resource-Location': targetPath,
            'Authorization': ('Basic ' + new Buffer(options.username + ':' + options.password).toString('base64'))
        }

    }, function (error, response) {
        if (response.statusCode === 201) {
            options.success && options.success(file, response);
            log('File \'' + JSON.parse(response.body).name + '\' successfully uploaded.');

        } else {
            options.error && options.error(file, response);
            log('Error while uploading file to \'' + options.confluenceBaseUrl + '\':\n' +
                response.statusCode + ' - ' + response.statusMessage);
        }
    }));

}


function removeAllResources(target) {

    var options = getTargetConfig(target);

    request({
        url: strformat(options.confluenceBaseUrl + DELETE_REST_URL, options.themeId),
        method: 'DELETE',
        headers: {
            'Authorization': ('Basic ' + new Buffer(options.username + ':' + options.password).toString('base64'))
        }
    });
}


function getViewportUrl(target) {
    var targetConfig = getTargetConfig(target);

    if (!targetConfig.hasOwnProperty('viewportUrl')) {
        throw new gutil.PluginError(PLUGIN_NAME, 'Property \'viewportUrl\' not set in target \'' + target + '\' - check ~/.viewportrc.');
    }

    return homeConfig.load(RC_FILENAME)[target].viewportUrl;
}


module.exports = {
    'upload': uploadPipeline,
    'removeAllResources': removeAllResources,
    'getViewportUrl': getViewportUrl
};
