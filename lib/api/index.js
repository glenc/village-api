var assert      = require('assert-plus');
var restify     = require('restify');
var bunyan      = require('bunyan');
var mongoose    = require('mongoose');
var auth        = require('./authentication');
var modelApi    = require('./model-api');
var models      = require('../../lib/models');

var createServer = module.exports.createServer = function(options) {
  assert.object(options);
  assert.object(options.log);
  assert.string(options.dbconn);

  // connect to db
  mongoose.connect(options.dbconn);

  // start up server
  var server = restify.createServer({
      log: options.log,
      name: 'village-api',
      version: '1.0.0'
  });

  server.pre(restify.pre.sanitizePath());
  server.pre(restify.pre.userAgentConnection());
  server.use(restify.requestLogger());

  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.dateParser());
  server.use(restify.authorizationParser());
  server.use(restify.queryParser());
  server.use(restify.gzipResponse());
  server.use(restify.bodyParser());

  // auth
  // todo - grab creds first
  // pass to authentication
  server.use(auth.authenticate);

  // set up routes
  var families = modelApi.createApi(models.Family, options);
  server.post('/families',      families.create);
  server.get( '/families',      families.query);
  server.head('/families',      families.query);
  server.get( '/families/:id',  families.get);
  server.put( '/families/:id',  families.update);
  server.del( '/families/:id',  families.del);

  var students = modelApi.createApi(models.Student, options);
  server.post('/students',      students.create);
  server.get( '/students',      students.query);
  server.head('/students',      students.query);
  server.get( '/students/:id',  students.get);
  server.put( '/students/:id',  students.update);
  server.del( '/students/:id',  students.del);

  // default / handler
  server.get('/', function root(req, res, next) {
    var routes = [
        'GET     /',
        'POST    /families',
        'GET     /families',
        'PUT     /families/:id',
        'GET     /families/:id',
        'DELETE  /families/:id',
        'POST    /students',
        'GET     /students',
        'PUT     /students/:id',
        'GET     /students/:id',
        'DELETE  /students/:id'
    ];
    res.send(200, routes);
    next();
  });

  // Setup an audit logger
  if (!options.noAudit) {
    server.on('after', restify.auditLogger({
      body: true,
      log: bunyan.createLogger({
            level: 'info',
            name: 'village-api-audit',
            stream: process.stdout
      })
    }));
  }

  return (server);
};