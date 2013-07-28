var Authentication = module.exports = function() {

  var authenticate = function(req, res, next) {
    if (!req.allow) {
      req.log.debug('skipping authentication');
      return next();
    }

    var authz = req.authorization.basic;
    if (!authz) {
      res.setHeader('WWW-Authenticate', 'Basic realm="village-api"');
      return next(new restify.UnauthorizedError('authentication required'));
    }

    if (authz.username !== allow.user || authz.password !== allow.pass) {
      return next(new restify.ForbiddenError('invalid credentials'));
    }

    return next();
  };

  return {
    authenticate: authenticate
  };
  
}();