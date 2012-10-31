/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var moment = require('moment');

/**
 * @log level defination
 */
var DEBUG   = exports.DEBUG     = 0x01;
var NOTICE  = exports.NOTICE    = 0x02;
var WARN    = exports.WARN      = 0x04;
var ERROR   = exports.ERROR     = 0x08;

var LOGLEVELMAP = {
  'debug' : DEBUG,
  'notice': NOTICE,
  'warn'  : WARN,
  'error' : error,
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

  return _me;
};

