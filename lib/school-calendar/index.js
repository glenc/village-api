'use strict';
var _ = require('underscore');

var SchoolCalendar = module.exports = function(config) {
  this.init(config);
};

SchoolCalendar.prototype = function() {
  var years = {};
  var classes = {};
  var cachedCurrentYear = "";

  // private methods

  var getYearsFromConfig = function(config) {
    if (!config || !config.classes) {
      return {};
    }

    var mapYear = function(original) {
      var start = new Date(original.startDate);
      var end = new Date(original.endDate);
      var now = new Date();
      return {
        startDate: start,
        endDate: end,
        isCurrent: start <= now && end >= now
      };
    };
    return _.chain(config.years)
            .pairs()
            .reduce(function(obj, pair) {
              obj[pair[0]] = mapYear(pair[1]);
              return obj;
            }, {})
            .value();
  };

  var getClassesFromConfig = function(config) {
    return (config && config.classes) ?
            _.clone(config.classes) :
            {};
  };

  var findCurrentYear = function(years) {
    for (var key in years) {
      if (years[key].isCurrent) {
        return key;
      }
    }
    return "";
  };

  // public methods

  var init = function(config) {
    years = getYearsFromConfig(config);
    classes = getClassesFromConfig(config);
    cachedCurrentYear = findCurrentYear(years);
  };

  var getYear = function(year) {
    return years[year];
  };

  var currentYear = function() {
    return cachedCurrentYear;
  };

  var gradeLevel = function(graduatingClass) {
    var cls = classes[graduatingClass];
    if (!cls) return 0;

    var first = getYear(cls.firstYear).startDate;
    var current = getYear(currentYear()).startDate;
    return current.getFullYear() - first.getFullYear() + 1;
  };

  return {
    init: init,
    getYear: getYear,
    currentYear: currentYear,
    gradeLevel: gradeLevel
  };

}();
