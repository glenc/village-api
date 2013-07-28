var restify = require('restify');
var bunyan  = require('bunyan');
var api     = require('./lib/api');

var NAME = 'village-api';
var LOG = bunyan.createLogger({
  name: NAME,
  streams: [
    {
      level: (process.env.LOG_LEVEL || 'info'),
      stream: process.stderr
    }, {
      level: 'debug',
      type: 'raw',
      stream: new restify.bunyan.RequestCaptureStream({
                level: bunyan.WARN,
                maxRecords: 100,
                maxRequestIds: 1000,
                stream: process.stderr
      })
    }
  ],
  serializers: restify.bunyan.serializers
});

(function main() {

  var options = {
    port: process.env.PORT || 8080,
    env:  process.env.NODE_ENV || 'development'
  };

  var dbconn = {
    development: 'mongodb://localhost/village-dev',
    test: 'mongodb://localhost/village-test',
    production: process.env[process.env.dbconn_env_var]
  };

  var server = api.createServer({
    log: LOG,
    dbconn: dbconn[options.env]
  });

  server.listen(options.port, function onListening() {
    LOG.info('listening at %s', server.url);
  });

})();