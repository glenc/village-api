var fs        = require('fs');
var mongoose  = require('mongoose');
var charlatan = require('charlatan');
var _         = require('underscore');
var schema    = require('../../lib/schema');

function genContact(defaults) {
  defaults = defaults || {};
  var c = {
    firstName: charlatan.Name.firstName(),
    lastName: defaults.lastName ? defaults.lastName : charlatan.Name.lastName(),
    email: charlatan.Internet.email(),
    phoneNumbers: [
      { type: "Home", number: charlatan.PhoneNumber.phoneNumber() }
    ]
  };
  if (!defaults.address) {
    c.address = {
      street1: charlatan.Address.streetAddress(),
      city: "Woodinville",
      state: "WA",
      zip: "98072"
    };
  } else {
    c.address = defaults.address;
  }
  return c;
}

function genStudent(lastName) {
  var classes = ["2013", "2014", "2015", "2016", "2017", "2018"];
  return {
    firstName: charlatan.Name.firstName(),
    lastName: lastName,
    graduatingClass: classes[Math.floor(Math.random() * classes.length)]
  };
}

function genFamily(singleParent, sameFamilyName, sameAddress){
  var primaryContact = genContact();
  var firstStudent = genStudent(primaryContact.lastName);

  var family = {
    contacts: [
      primaryContact
    ],
    students: [
      firstStudent
    ]
  };

  if (singleParent === false) {
    defaults = {};
    if (sameFamilyName) {
      defaults.lastName = primaryContact.lastName;
    }
    if (sameAddress) {
      defaults.address = primaryContact.address;
    }
    family.contacts.push(genContact(defaults));
  }

  var fname = primaryContact.lastName;
  if (singleParent === false && sameFamilyName === false) {
    fname = _.reduce(family.contacts, function(memo, item) {
      var prefix = memo;
      if (prefix !== "") {
        prefix += "_";
      }
      return prefix += item.lastName;
    }, "");
  }
  family.name = fname;

  var distro = [1,2,3];
  numKids = distro[Math.floor(Math.random() * 3)];
  
  for (var i=1; i<numKids; i++) {
    family.students.push(genStudent(primaryContact.lastName));
  }

  return family;
}

function genSimpleFamily(){ return genFamily(false, true, true); }
function genMixedFamily(){ return genFamily(false, false, true); }
function genSeparatedFamily(){ return genFamily(false, false, false); }
function genMixedSeparatedFamily(){ return genFamily(false, false, false); }
function genSingleParentFamily(){ return genFamily(true); }

function createFamily(generator, done) {
  var fam = generator();
  schema.FamilySchema.create(fam, function(err, f) {
    if (f) {
      var studentData = _.map(fam.students, function(x) { x.family = f._id; return x; });
      schema.StudentSchema.create(studentData, function(err, s) {
        done();
      });
    } else {
      done();
    }
  });
}

exports.genData = function(num, done) {
  mongoose.connect('mongodb://localhost/village-dev');
  charlatan.setLocale('en-us');

  var finished = 0;
  var finalize = function() {
    finished++;
    if (finished == num) {
      done();
    }
  };
  
  for (var i=0; i<num; i++){
    var famFunctions = [
      genSimpleFamily,
      genSimpleFamily,
      genMixedFamily,
      genSeparatedFamily,
      genSingleParentFamily,
      genMixedSeparatedFamily,
      genSimpleFamily,
      genSimpleFamily,
      genSingleParentFamily,
      genMixedSeparatedFamily
    ];

    var rand = Math.floor((Math.random()*10));
    createFamily(famFunctions[rand], finalize);
  }
};

exports.clearData = function(done) {
  mongoose.connect('mongodb://localhost/village-dev');
  schema.ConfigSchema.remove({}, function() {
    schema.FamilySchema.remove({}, function() {
      schema.StudentSchema.remove({}, done);
    });
  });
};

exports.loadConfig = function(path, done) {
  mongoose.connect('mongodb://localhost/village-dev');
  fs.readFile(path, 'utf8', function (err, data) {
    setting = JSON.parse(data);
    schema.ConfigSchema.create(setting, done);
  });
};