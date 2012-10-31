/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var moment = require('moment');
var mkdirp = require('mkdirp');

/**
 * @log level defination
 */
var DEBUG   = exports.DEBUG  = 1;
var NOTICE  = exports.NOTICE = 2;
var WARN    = exports.WARN   = 4;
var ERROR   = exports.ERROR  = 8;

var LOGLEVELMAP = {
  'debug' : DEBUG,
  'notice': NOTICE,
  'warn'  : WARN,
  'error' : ERROR,
};

var __exceptionLogger = null;
exports.setExceptionLogger = function (options) {
  __exceptionLogger = exports.create(options);
};

exports.logExcepton = function (e, info) {
  if (__exceptionLogger) {
    __exceptionLogger._exception(e, info);
  }
};

exports.create = function (options) {

  var _options = {
    'fname' : '',
    'level' : 255 & ~DEBUG,
  };

  var _stream = null;

  var _write2stream = function () {
    console.log(arguments);
  };

  var _me = {};
  for (var i in LOGLEVELMAP) {
    _me[i] = function () {
      if (_options.level & LOGLEVELMAP[i]) {
        _write2stream(arguments);
      }
    }
  }

  _me.setLogLevel = function (level) {
    _options.level = Number(level);
  };

  _me._exception = function (e, info) {
    if (!(e instanceof Error)) {
      return;
    }

    var ename = e.name ? e.name : 'UnknownException';
    if (ename.indexOf('Exception') < 0) {
      ename = ename + 'Exception';
    }
    _write2stream('aa');
  };

  return _me;
};

