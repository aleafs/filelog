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

/* {{{ private function trim() */
var trim = function (str) {
  var m = str.length;
  for (var i = 0; i < m; i++) {
    if (str.charCodeAt(i) > 32) {
      break;
    }
  }

  for (var j = m - 1; j > i; j--) {
    if (str.charCodeAt(j) > 32) {
      break;
    }
  }

  return str.slice(i, j + 1);
};
/* }}} */

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
   * @ 当前时间
   */
  var _moment = moment();

  /**
   * @ 写入stream
   */
  var _stream = null;

  /* {{{ private function _sclose() */
  var _sclose = function () {
    if (!_stream) {
      return;
    }

    _stream.end();
    _stream.destroySoon();
    _stream = null;
  };
  /* }}} */

  /* {{{ private function _reopen() */

  /**
   * @ 上次计算的文件名
   */
  var _fname_ = null;

  var _reopen = function (fname) {
    if (_stream) {
      _sclose();
    }

    var num = 3;
    var fd  = null;
    do {
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
    } while (!fd && num > 0);

    _stream = fs.createWriteStream(fname, {'fd' : fd || 1, 'encoding' : 'utf8'});
    _stream.on('error', function (e) {});
    _fname_ = _stream.path;
  };
  /* }}} */

  /* {{{ private function _rotate() */
  var _timer_ = null;
  (function _rotate() {
    _moment = moment();

    var fname = _options.file;
    (_options.file.match(/\{.+?\}/g) || []).forEach(function (p) {
      fname = fname.replace(p, _moment.format(p.substr(1, p.length - 2)));
    });

    if (fname !== _fname_) {
      _reopen(fname);
    }
    _timer_ = setTimeout(_rotate, 500);
  })();
  /* }}} */

  var _me = {};

  /* {{{ public function debug, notice, warn, error */
  Object.keys(LOGLEVELMAP).forEach(function (i) {
    _me[i] = function (msg) {
      if (_stream && (_options.level & LOGLEVELMAP[i])) {
        _stream.write(util.format('%s:\t[%s]\t%d\t%j\n', i.toUpperCase(), 
            _moment.format('YYYY-MM-DD HH:mm:ss'), process.pid, trim(msg)));
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

    var stack = [util.format('%s %s: %s', _time, ename, e.stack)];
    for (var i in info) {
      stack.push(util.format('%s: %j', i, info[i]));
    }
    stack.push(_time, '', '');
    _stream.write(stack.join('\n'));
  };
  /* }}} */

  _me.__logfile = function () {
    return _fname_;
  };

  return _me;
};

