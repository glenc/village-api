var mongoose = require('mongoose');
var config = require('./config.json');

module.exports = function(options) {
  options = options || config;

  if (mongoose.connection.readyState === 0) {
    mongoose.connect(options.dbconn, function (err) {
     if (err) {
       throw err;
     }
   });
  }

  var resetDb = function(schemas, done) {
    var removed = 0;

    var finalize = function() {
      if (removed == schemas.length) {
        return done();
      }
    };

    schemas.forEach(function(s) {
      s.remove(function() {
        removed++;
        finalize();
      });
    });
  };

  var generateCalendar = function() {
    var makeDate = function(offset, m, d) {
      var year = new Date().getFullYear();
      if (offset) {
        year = year + offset;
      }
      var dt = new Date(year, m, d);
      return dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate();
    };

    var startDate = function(offset) {
      return makeDate(offset, 0, 1);
    };

    var endDate = function(offset) {
      return makeDate(offset, 11, 31);
    };

    return {
      key: 'school-calendar',
      value: {
        years: {
          twoYearsAgo:     { startDate: startDate(-2), endDate: endDate(-2) },
          oneYearAgo:      { startDate: startDate(-1), endDate: endDate(-1) },
          current:         { startDate: startDate(),   endDate: endDate()   },
          oneYearFromNow:  { startDate: startDate(1),  endDate: endDate(1)  },
          twoYearsFromNow: { startDate: startDate(2),  endDate: endDate(2)  }
        },
        classes: {
          firstGrade: {
            firstYear: 'current',
            lastYear: 'twoYearsFromNow'
          },
          secondGrade: {
            firstYear: 'oneYearAgo',
            lastYear: 'oneYearFromNow'
          }
        }
      }
    };
  };

  return {
    db: {
      reset: resetDb
    },
    config: {
      generateCalendar: generateCalendar
    }
  };
};