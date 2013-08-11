var CRITERIA_SEPARATOR  = ',';
var KVP_SEPARATOR       = ':';
var WILDCARD            = '*';

var toKvp = function(string) {
  var parts = string.split(KVP_SEPARATOR);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { key:parts[0] };
  return { key:parts[0], val:parts[1] };
};

var wildcardToRegex = function(kvp) {
  if (kvp.val) {
    if (kvp.val.indexOf(WILDCARD) > -1) {
      var cleanVal = kvp.val.replace(new RegExp('\\' + WILDCARD, 'g'), '');
      if (kvp.val[0] == WILDCARD && kvp.val[kvp.val.length-1] == WILDCARD) {
        kvp.val = new RegExp(cleanVal, 'i');
      } else if (kvp.val[0] == WILDCARD) {
        kvp.val = new RegExp(cleanVal + '$', 'i');
      } else if (kvp.val[kvp.val.length-1] == WILDCARD) {
        kvp.val = new RegExp('^' + cleanVal, 'i');
      }
    }
  }
  return kvp;
}

var appendToObject = function(obj, kvp) {
  if (!kvp) { return obj; }
  obj[kvp.key] = kvp.val;
  return obj;
};

var parse = module.exports.parse = function(string) {
  if (!string || string === '') { return {}; }
  return string.split(CRITERIA_SEPARATOR)
               .map(toKvp)
               .map(wildcardToRegex)
               .reduce(appendToObject, {});
};