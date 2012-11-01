[![Build Status](https://secure.travis-ci.org/aleafs/filelog.png?branch=master)](http://travis-ci.org/aleafs/filelog)

## About

`filelog` 是一个简单的本地文件日志类，提供的特性有：

* 日志分级，并且可根据需要动态调整日志级别；
* 根据时间进行日志文件的自动切割；
* 对Error对象堆栈的记录，支持将全局Error记录在同一个文件，便于监控分析。

## Install

```bash
$ npm install filelog
```

## Usage

* 简单上手:

```javascript

var filelog = require('filelog');

var log = filelog.create({
  'file' : 'a.log', 
  'level' : filelog.WARN | filelog.ERROR
});
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

[MIT](LICENSE)