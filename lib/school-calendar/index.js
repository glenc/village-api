var _ = require('underscore');

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

var create = module.exports.create = function(config) {
  var years = getYearsFromConfig(config);
  var classes = getClassesFromConfig(config);

  var calendar = new SchoolCalendar(years, classes);
  return calendar;
};

var SchoolCalendar = function(years, classes) {
  this.years = years;
  this.classes = classes;
  this.cachedCurrentYear = findCurrentYear(years);
};

SchoolCalendar.prototype.getYear = function(year) {
  return this.years[year];
};

SchoolCalendar.prototype.currentYear = function() {
  return this.cachedCurrentYear;
};

SchoolCalendar.prototype.gradeLevel = function(graduatingClass) {
  var cls = this.classes[graduatingClass];
  if (!cls) return 0;

  var first = this.getYear(cls.firstYear).startDate;
  var current = this.getYear(this.currentYear()).startDate;
  return current.getFullYear() - first.getFullYear() + 1;
};
