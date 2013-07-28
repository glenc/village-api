var schema          = require('../../lib/schema');
var SchoolCalendar  = require('../../lib/school-calendar');
var errors          = require('./errors');

var Student = module.exports = function() {

  var studentToObject = function(student) {
    return student.toObject();
  };

  var populateStudent = function(id, student, calData, callback) {
    var s = student;
    var c = calData;

    if (!id && !student) {
      return callback(new Error("Must provide an id or a student"));
    }

    var finalize = function(err) {
      if (err) return callback(err);
      if (s && c) {
        var tmp = studentToObject(s);
        var cal = new SchoolCalendar(c.value);
        tmp.grade = cal.gradeLevel(s.graduatingClass);
        return callback(null, tmp);
      }
    };

    // if we already have everything, combine and return
    finalize();

    if (!s) {
      schema.StudentSchema.findById(id, function(err, doc) {
        if (err) return finalize(err);
        if (!doc) return finalize(new errors.NotFoundError());
        s = doc;
        finalize();
      });
    }

    if (!c) {
      schema.ConfigSchema.findOne({key: 'school-calendar'}, function(err, doc) {
        if (err) return finalize(err);
        if (!doc) return finalize(new errors.ConfigError('Required configuration setting school-calendar was not found.'));
        c = doc;
        finalize();
      });
    }

  };

  var query = function(query, expand, callback) {
    var students;
    var calData;
    var loadGrade = true;

    var finalize = function(err) {
      if (err) return callback(err);
      if (students && calData) {
        var cal = new SchoolCalendar(calData.value);
        var results = students.map(function(s) {
          var tmp = studentToObject(s);
          if (loadGrade) {
            tmp.grade = cal.gradeLevel(s.graduatingClass);
          }
          return tmp;
        });
        callback(null, results);
      }
    };

    var expandString = "";
    if (expand) {
      var props = [];
      expand.split(',')
            .forEach(function(p) {
              if (p == "-grade") {
                loadGrade = false;
              } else {
                props.push(p);
              }
            });
      expandString = props.join(' ');
    }

    schema.StudentSchema.find(query, expandString, function(err, results) {
      if (err) return finalize(err);
      students = results;
      finalize();
    });

    schema.ConfigSchema.findOne({key: 'school-calendar'}, function(err, doc) {
      if (err) return finalize(err);
      if (!doc) return finalize(new errors.ConfigError('Required configuration setting school-calendar was not found.'));
      calData = doc;
      finalize();
    });
  };

  var get = function(id, callback) {
    populateStudent(id, null, null, callback);
  };

  var create = function(student, callback) {
    schema.StudentSchema.create(student, function(err, doc) {
      if (err) return callback(err);
      populateStudent(null, doc, null, callback);
    });
  };

  var update = function(id, student, callback) {
    schema.StudentSchema.findByIdAndUpdate(id, student, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      populateStudent(null, doc, null, callback);
    });
  };

  var del = function(id, callback) {
    schema.StudentSchema.findByIdAndRemove(id, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      callback(null);
    });
  };

  return {
    query: query,
    get: get,
    create: create,
    update: update,
    del: del
  };
}();