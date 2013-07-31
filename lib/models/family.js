var schema  = require('../../lib/schema');
var Student = require('./student');
var errors  = require('./errors');

var Family = module.exports = function() {

  var familyToObject = function(family, students) {
    var mapped = family.toObject();
    if (students) {
      mapped.students = students;
    }
    return mapped;
  };

  var query = function(query, expand, callback) {
    var families;
    var students;
    var includeStudents = false;

    var finalize = function(err) {
      if (err) return callback(err);
      if (families && (!includeStudents || students)) {
        var results = families.map(function(f) {
          var s;
          if (includeStudents) {
            s = students.filter(function(s) {
              return f._id.equals(s.family);
            });
          }
          return familyToObject(f, s);
        });
        callback(null, results);
      }
    };

    var expandString = '';
    if (expand) {
      var props = [];
      expand.split(',')
            .forEach(function(p) {
              if (p == 'students') {
                includeStudents = true;
              } else {
                props.push(p);
              }
            });

      // special case where only students were asked for
      if (props.length === 0) {
        props.push('_id');
      }
      expandString = props.join(' ');
    }

    schema.FamilySchema.find(query, expandString, function(err, results) {
      if (err) return finalize(err);
      families = results;
      finalize();
    });

    if (includeStudents) {
      Student.query({}, null, function(err, results) {
        if (err) return finalize(err);
        students = results;
        finalize();
      });
    } else {
      finalize();
    }
  };

  var get = function(id, callback) {
    var family;
    var students;

    var finalize = function(err) {
      if (err) return callback(err);
      if (family && students) {
        callback(null, familyToObject(family, students));
      }
    };

    schema.FamilySchema.findById(id, function(err, doc) {
      if (err) return finalize(err);
      if (!doc) return finalize(new errors.NotFoundError());
      family = doc;
      finalize();
    });

    Student.query({family: id}, null, function(err, results) {
      if (err) return finalize(err);
      students = results;
      finalize();
    });
  };

  var getContacts = function(id, callback) {
    schema.FamilySchema.findById(id, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      callback(null, familyToObject(doc).contacts.items);
    });
  };

  var getStudents = function(id, callback) {
    schema.FamilySchema.findById(id, function(err, doc) {
      if (err) return callback(err);
      if (!doc) return callback(new errors.NotFoundError());
      Student.query({family: id}, null, callback);
    });
  };

  var create = function(family, callback) {
    schema.FamilySchema.create(family, function(err, f) {
      if (err) return callback(err);
      callback(null, familyToObject(f));
    });
  };

  var update = function(id, family, callback) {
    delete family._id;
    schema.FamilySchema.findByIdAndUpdate(id, family, function(err, f) {
      if (err) return callback(err);
      if (!f) return callback(new errors.NotFoundError());
      callback(null, familyToObject(f));
    });
  };

  var del = function(id, callback) {
    schema.FamilySchema.findByIdAndRemove(id, function(err, f) {
      if (err) return callback(err);
      if (!f) return callback(new errors.NotFoundError());
      callback(null);
    });
  };

  return {
    query: query,
    get: get,
    getContacts: getContacts,
    getStudents: getStudents,
    create: create,
    update: update,
    del: del
  };
}();