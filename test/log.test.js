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
    _me.close();
    setTimeout(function() {
      var _text = fs.readFileSync(_me.__logfile(), 'utf-8');
      _text.should.not.include("DEBUG:\t");
      _text.should.include("NOTICE:\t");
      _text.should.include("\"i am a bad boy\"");
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
    _me.error('dd i am a bad boy');
    _me.close();
    _me.error('ee i am a bad boy');

    setTimeout(function() {
      var _text = fs.readFileSync(_fn, 'utf8');

      _text.should.not.include("DEBUG:\t");
      _text.should.not.include("NOTICE:\t");
      _text.should.include("WARN:\t");
      _text.should.include("ERROR:\t");
      _text.should.not.include("ee i am a bad boy");

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
      _text.should.include("LOG1");
      _text.should.include("LOG2");
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
      _text.should.not.include('I will not be loged');
      _text.should.include('ErrorException');
      _text.should.include(err.stack);
      _text.should.include('key2: ["value2\\naa"]');
      done();
    }, 50);
  });
  /* }}} */

});
