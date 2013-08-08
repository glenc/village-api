var CRITERIA_SEPARATOR  = ',';
var KVP_SEPARATOR       = ':';

var toKvp = function(string) {
  var parts = string.split(KVP_SEPARATOR);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { key:parts[0] };
  return { key:parts[0], val:parts[1] };
};

var toRegex = function(kvp) {
  if (kvp.val) {
    kvp.val = new RegExp(kvp.val, 'i');
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
               .map(toRegex)
               .reduce(appendToObject, {});
};