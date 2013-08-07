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

  var getExpandProps = function(expand) {
    var props = { family: [], student: [] };
    if (!expand) { return props; }

    expand.split(' ').forEach(function(p) {
      var pat = /^students\.[a-z]+$|^students$/i;
      if (pat.test(p)) {
        props.student.push(p);
      } else {
        props.family.push(p);
      }
    });

    return props;
  };

  var getStudentsExpandString = function(props) {
    var tmp = props.map(function(p) { return p.replace(/students[\.]*/i, ''); })
                   .filter(function(p) { return p !== ''; });
    if (tmp.length > 0 && tmp.indexOf('family') === -1) {
      tmp.push('family');
    }
    return tmp.join(' ');
  };

  var query = function(query, expand, callback) {
    var families;
    var students;
    var includeStudents = true;

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

    var expandProps = getExpandProps(expand);
    includeStudents = expandProps.student.length > 0;

    var expandString = '';
    if (expandProps.student.length > 0 && expandProps.family.length === 0) {
      expandString = '_id';
    }
    if (expandProps.family.length > 0) {
      expandString = expandProps.family.join(' ');
    }

    schema.FamilySchema.find(query, expandString, function(err, results) {
      if (err) return finalize(err);
      families = results;
      finalize();
    });

    if (includeStudents) {
      var studentExpString = getStudentsExpandString(expandProps.student);
      Student.query({}, studentExpString, function(err, results) {
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