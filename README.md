[![Build Status](https://secure.travis-ci.org/aleafs/filelog.png?branch=master)](http://travis-ci.org/aleafs/filelog)

## About

`filelog` is a simple text log writer for Node.js.

## Install

```bash
$ npm install filelog
```

## Usage

* 简单上手:

```javascript

var filelog = require('filelog');

var log = filelog.create({'file' : 'a.log', 'level' : filelog.WARN | filelog.ERROR});
log.debug('ignore');
log.warn('warn1');

```

* 在日志文件名中增加通配符使之按时间切割:

``` javascript
var log = filelog.create({
  'file' : '{YYYY}/a.{MM-DD}.log'
});

log.notice('notice');
```

* 将所有异常都记录到同一个日志中:

```javascript

filelog.setExceptionLogger({'file' : 'error.log'});
filelog.logException(new Error('test'));
```

## License

