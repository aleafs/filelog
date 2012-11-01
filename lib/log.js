/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

"use strict";

var fs = require('fs');
var path = require('path');
var util = require('util');
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

exports.logException = function (e, info) {
  if (__exceptionLogger) {
    __exceptionLogger._exception(e, info);
  }
};

exports.create = function (options) {

  var _options = {
    'file' : '',
    'level' : 255 & ~DEBUG,
  };
  for (var i in options) {
    _options[i] = options[i];
  }
  _options.level = Number(_options.level);

  /**
   * @ 行格式化
   */
  var _format = function (msg, level) {
    return util.format('%s:\t[%s]\t%d\t%j', level, 
        moment().format('YYYY-MM-DD HH:mm:ss'), process.pid, msg);
  };

  /**
   * @ 写入stream
   */
  var _stream = null;

  var _inode_ = 0;

  /* {{{ private function _sclose() */
  var _sclose = function () {
    if (_stream) {
      _stream.end();
      _stream = null;
    }
  };
  /* }}} */

  /* {{{ private function _reopen() */

  var _reopen = function (fname) {

    _sclose();

    var num = 3;
    var fd  = null;
    while (!fd && num > 0) {
      try {
        fd = fs.openSync(fname, 'a+', 420);
      } catch (e) {
        if ('ENOENT' === e.code) {
          try {
            mkdirp.sync(path.dirname(fname), 493);  /**<  0755  */
          } catch (e) {
          }
        }
      }
      num--;
    }

    _inode_ = 0;
    _stream = fs.createWriteStream(fname, {'fd' : fd || 1, 'encoding' : 'utf8'});
    _stream.on('error', function (e) {});
  };
  /* }}} */

  /* {{{ private function _rotate() */
  var _timer_ = null;
  (function _rotate() {

    var now = moment();
    var log = _options.file;
    var tms = 1000;
    (_options.file.match(/\{.+?\}/g) || []).forEach(function (p) {
      log = log.replace(p, now.format(p.substr(1, p.length - 2)));
      if (p.indexOf('s') > -1) {
        tms = 100;
      }
    });

    if (!_stream || log !== _stream.path) {
      _reopen(log);
    }
    log && fs.stat(log, function (e, s) {
      _timer_ = setTimeout(_rotate, tms);
      if (_inode_ && (!s || _inode_ !== s.ino)) {
        _reopen(log);
      }
      if (!e) {
        _inode_ = s.ino;
      }
    });
  })();
  /* }}} */

  var _me = {};

  /* {{{ public function debug, notice, warn, error */
  Object.keys(LOGLEVELMAP).forEach(function (i) {
    _me[i] = function (msg) {
      if (_stream && (_options.level & LOGLEVELMAP[i])) {
        _stream.write(_format(msg, i.toUpperCase()) + '\n');
      }
    }
  });
  /* }}} */

  /* {{{ public function close() */
  _me.close = function () {
    if (_timer_) {
      clearTimeout(_timer_);
      _timer_ = null;
    }
    _sclose();
  };
  /* }}} */

  /* {{{ public function setFormatter() */
  _me.setFormatter = function (fn) {
    if ('function' === (typeof fn)) {
      _format = fn;
    }
  };
  /* }}} */

  /* {{{ public function setLogLevel() */
  _me.setLogLevel = function (level) {
    _options.level = Number(level);
  };
  /* }}} */

  /* {{{ public function _exception() */
  _me._exception = function (e, info) {
    if (!(e instanceof Error) || !_stream) {
      return;
    }

    var ename = e.name ? e.name : 'UnknownException';
    if (ename.indexOf('Exception') < 0) {
      ename = ename + 'Exception';
    }

    var _time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

    var stack = [util.format('%s nodejs.%s: %s', _time, ename, e.stack)];
    for (var i in info) {
      stack.push(util.format('%s: %j', i, info[i]));
    }
    stack.push(_time, '\n');
    _stream.write(stack.join('\n'));
  };
  /* }}} */

  _me.__logfile = function () {
    return _stream ? _stream.path : null;
  };

  return _me;
};

