/* vim: set expandtab tabstop=2 shiftwidth=2 foldmethod=marker: */

var should  = require('should');
var fs  = require('fs');
var exec = require('child_process').exec;
var Log = require(__dirname + '/../');

describe('file log', function() {

  beforeEach(function (done) {
    exec('rm -rf "' + __dirname + '/tmp"', function (error) {
      should.ok(!error);
      done();
    });
  });

  /* {{{ should_log_create_and_write_works_fine() */
  it ('should_log_create_and_write_works_fine', function(done) {
    var _fn = __dirname + '/tmp/{YYYY}/test-{MM-DD}.log';
    var _me = Log.create({
      'file'  : _fn
    });
    _me.debug('i will be ignore');
    _me.notice("i am a bad boy");
    setTimeout(function() {
      var _text = fs.readFileSync(_me.__logfile(), 'utf-8');
      _text.should.not.containEql("DEBUG:\t");
      _text.should.containEql("NOTICE:\t");
      _text.should.containEql("\"i am a bad boy\"");
      _me.close();
      done();
    }, 50);
  });
  /* }}} */

  /* {{{ should_set_log_level_works_fine() */
  it ('should_set_log_level_works_fine', function(done) {
    var _fn = __dirname + '/tmp/test.log';
    var _me = Log.create({
      'file'  : _fn, 'level' : Log.WARN | Log.ERROR,
    });

    _me.debug('aa i will be ignore');
    _me.notice('bb i am a bad boy');
    _me.warn('cc i am a bad boy');
    _me.setLogLevel(Log.ERROR | Log.DEBUG);
    _me.error('dd i am a bad boy');
    _me.debug('debug2');
    _me.close();
    _me.error('ee i am a bad boy');

    setTimeout(function() {
      var _text = fs.readFileSync(_fn, 'utf8');

      _text.should.not.containEql("aa i will be ignore");
      _text.should.not.containEql("NOTICE:\t");
      _text.should.containEql("WARN:\t");
      _text.should.containEql("ERROR:\t");
      _text.should.containEql('debug2');
      _text.should.not.containEql("ee i am a bad boy");

      done();
    }, 50);
  });
  /* }}} */

  /* {{{ should_log_append_write_works_fine() */
  it('should_log_append_write_works_fine', function(done) {
    var _fn = __dirname + '/tmp/test.log';
    var lg1 = Log.create({'file' : _fn});
    var lg2 = Log.create({'file' : _fn});
    lg1.error('LOG1');
    lg1.debug('DEBUG');
    lg2.error('LOG2');
    lg1.close();
    lg2.close();

    setTimeout(function() {
      var _text = fs.readFileSync(_fn, 'utf8');
      _text.should.containEql("LOG1");
      _text.should.containEql("LOG2");
      done();
    }, 50);
  });
  /* }}} */

  /* {{{ should_exception_log_works_fine() */
  it('should_exception_log_works_fine', function (done) {
    var _fn = __dirname + '/tmp/test.log';
    Log.setExceptionLogger({'file' : _fn, 'level' : Log.WARN});

    Log.logException({'a' : 'I will not be loged'});

    var err = new Error('hello');
    Log.logException(err, {'key1' : 'value1', 'key2' : ['value2\naa']});

    /**
     * @ err对象不能被修改
     */
    err.name.should.eql('Error');

    setTimeout(function() {
      var _text = fs.readFileSync(_fn, 'utf8');
      _text.should.not.containEql('I will not be loged');
      _text.should.containEql(' nodejs.ErrorException:');
      _text.should.containEql(err.stack);
      _text.should.containEql('key2: ["value2\\naa"]');
      done();
    }, 50);
  });
  /* }}} */

  /* {{{ should_my_formatter_works_fine() */
  it('should_my_formatter_works_fine', function (done) {
    var _fn = __dirname + '/tmp/test.log';
    var _me = Log.create({'file' : _fn});
    _me.setFormatter(function (level, tag, msg) {
      return 'HELLO\t[' + tag + '] ' + msg;
    });

    _me.debug('tag0', 'test0');
    _me.notice('tag1', 'test1');
    _me.warn('tag2', 'test2');
    setTimeout(function () {
      fs.readFile(_me.__logfile(), 'utf8', function (e, data) {
        should.ok(!e);
        data.should.eql('HELLO\t[tag1] test1\nHELLO\t[tag2] test2\n');
        _me.close();
        done();
      });
    }, 50);
  });
  /* }}} */

  /* {{{ should_console_log_when_open_fail() */
  it('should_console_log_when_open_fail', function (done) {
    var _me = Log.create({'file' : ''});
    _me.error('console.log');
    done();
  });
  /* }}} */

  /* {{{ should_log_works_fine_after_file_rename() */
  it('should_log_works_fine_after_file_rename', function (done) {
    var _fn = __dirname + '/tmp/test.log';
    var _me = Log.create({
      'file'  : _fn,
    });
    var cmd = require('util').format('rm -f "%s" && touch "%s"', _fn, _fn);
    _me.notice('test1');

    exec(cmd, function (error) {
      should.ok(!error);
      setTimeout(function () {
        _me.notice('test2');
        setTimeout(function () {
          fs.readFile(_fn, 'utf8', function (e, data) {
            should.ok(!e);
            data.should.containEql('test2');
            done();
          });
        }, 50);
      }, 1010);
    });
  });
  /* }}} */

  /* {{{ should_log_rotate_works_fine() */
  it('should_log_rotate_works_fine', function (done) {
    var _me = Log.create({
      'file' : __dirname + '/tmp/rotate.{HH:mm:ss}.log',
    });
    var _fn = _me.__logfile();
    _me.notice('time1');
    process.nextTick(function () {
      fs.readFile(_fn, 'utf8', function (e, data) {
        should.ok(!e);
        data.should.containEql('time1');
        setTimeout(function () {
          _me.notice('time2');
          _me.__logfile().should.not.eql(_fn);
          _fn = _me.__logfile();
          process.nextTick(function () {
            fs.readFile(_fn, 'utf8', function (e, data) {
              should.ok(!e);
              data.should.not.containEql('time1');
              data.should.containEql('time2');
              _me.close();
              done();
            });
          });
        }, 1010);
      });
    });
  });
  /* }}} */

});
