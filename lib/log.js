/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
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
    'file' : '',
    'level' : 255 & ~DEBUG,
  };
  for (var i in _options) {
    _options[i] = options[i];
  }

  /**
   * @ 当前时间
   */
  var _moment = null;

  /**
   * @ 写入stream
   */
  var _stream = null;
  var _sclose = function () {
    if (!_stream) {
      return;
    }

    _stream.end();
    _stream.destroySoon();
    _stream = null;
  };

  /**
   * @ 上次计算的文件名
   */
  var _fname_ = null;

  var _reopen = function (fname) {
    if (_stream) {
      _sclose();
    }

    var tries = 1;
    _stream = fs.createWriteStream(fname, {
      'flags' : 'a+', 'mode' : 420   /** 0644 */,
    });
    _stream.on('error', function (e) {
      if (tries && 'ENOENT' === e.code) {
        mkdirp.sync(path.dirname(fname), 420);
        _stream = fs.createWriteStream(fname, {
          'flags' : 'a+', 'mode' : 420,
        });
      }
      tries--;
    });
    _fname_ = fname;
  };

  var _timer_ = null;
  (function _rotate() {
    _moment = moment();

    var fname = _options.file;
    _options.file.match(/\{.+?\}/g).forEach(function (p) {
      fname = fname.replace(p, _moment.format(p.substr(1, p.length - 2)));
    });

    if (fname !== _fname_) {
      _reopen(fname);
    }

    _timer_ = setTimeout(_rotate, 500);
  })();

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

  _me.close = function () {
    if (_timer_) {
      clearTimeout(_timer_);
      _timer_ = null;
    }
    _sclose();
  };

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

