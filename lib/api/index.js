var assert      = require('assert-plus');
var restify     = require('restify');
var bunyan      = require('bunyan');
var mongoose    = require('mongoose');
var auth        = require('./authentication');
var modelApi    = require('./model-api');
var models      = require('../../lib/models');

var crossOrigin = function(req, res, next) {
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Cookie, Set-Cookie, Accept, Access-Control-Allow-Credentials, Origin, Content-Type, Request-Id , X-Api-Version, X-Request-Id');
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  return next();
};

var handleOptions = function(req, res, next) {
  if (req.headers.origin && req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Cookie, Set-Cookie, Accept, Access-Control-Allow-Credentials, Origin, Content-Type, Request-Id , X-Api-Version, X-Request-Id');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie');
    res.header('Allow', req.headers['access-control-request-method']);
    res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
    if (req.log) {
      req.log.info({
        url: req.url,
        method: req.headers['access-control-request-method']
      }, "Preflight");
    }
    res.send(204);
    return next();
  } else {
    res.send(404);
    return next();
  }
};

var initRoutes = function(server, routes, options) {
  routes.forEach(function(route) {
    var api = modelApi.createApi(route.model, options);
    server.post(route.url,          api.create);
    server.get (route.url,          api.query);
    server.head(route.url,          api.query);
    server.get (route.url + '/:id', api.get);
    server.put (route.url + '/:id', api.update);
    server.del (route.url + '/:id', api.del);
  });
};

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
  server.use(crossOrigin);

  server.opts('.*', handleOptions);

  // set up routes
  initRoutes(server, [
    { url: '/families', model: models.Family },
    { url: '/students', model: models.Student },
    { url: '/config',   model: models.Config }
  ], options);

  // default / handler
  server.get('/', function root(req, res, next) {
    res.send(200, 'ok');
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