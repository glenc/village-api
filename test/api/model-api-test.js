var expect          = require('chai').expect;
var restify         = require('restify');
var helper          = require('../test-helper')();
var schema          = require('../../lib/schema');
var configCalendar  = require('../fixtures/config-school-calendar.json');

var modelTests = [
  {
    url: '/families',
    schema: schema.FamilySchema,
    sampleData: function() {
      return {
        name: 'Test',
        contacts: [
          { firstName: 'Glen', lastName: 'Cooper', address: { street1: '123' }, phoneNumbers: [ { type:'Home', number: '123' } ] },
          { firstName: 'Shannon', lastName: 'Stevens', address: { street1: '123' }, phoneNumbers: [ { type:'Home', number: '123' } ] }
        ]
      };
    },
    create: function(data, done) {
      schema.FamilySchema.create(data, done);
    }
  },
  {
    url: '/students',
    schema: schema.StudentSchema,
    sampleData: function() {
      return {
        firstName: 'Joe',
        lastName: 'Student',
        graduatingClass: '2015'
      };
    },
    create: function(data, done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        if (Array.isArray(data)) {
          data = data.map(function(d) {
            d.family = doc._id;
            return d;
          });
        } else {
          data.family = doc._id;
        }
        schema.StudentSchema.create(data, done);
      });
    },
    beforeCreate: function(model, done) {
      schema.FamilySchema.create({name:"Test"}, function(err, doc) {
        model.family = doc._id;
        done(model);
      });
    }
  }
];

var client = restify.createJsonClient({
  url: 'http://localhost:8080',
  version: '*'
});

modelTests.forEach(function(test) {
  var reset = function(done) {
    helper.db.reset([schema.FamilySchema, schema.StudentSchema, schema.ConfigSchema], done);
  };

  var init = function(done) {
    reset(function() {
      schema.ConfigSchema.create(configCalendar, done);
    });
  };

  var initWithOne = function(done) {
    init(function() {
      test.create(test.sampleData(), function(err, doc) {
        done(doc._id);
      });
    });
  };

  describe(test.url, function() {
    describe('GET', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];
      var context = {};

      before(function(done) {
        init(function() {
          var makeSample = function(val) {
            var obj = test.sampleData();
            obj[prop] = val;
            return obj;
          };
          var models = randomVals.map(makeSample);
          test.create(models, function() {
            client.get(test.url, function(err, req, res, data) {
              context.data = data;
              context.res = res;
              context.err = err;
              done();
            });
          });
        });
      });

      after(reset);

      it('returns 200', function() {
        expect(context.res.statusCode).to.equal(200);
      });

      it('returns data', function() {
        expect(context.data).to.exist;
      });

      it('does not return an error', function() {
        expect(context.err).not.to.exist;
      });

      it('returns all results as an array', function() {
        expect(context.data).to.have.length(randomVals.length);
        context.data.forEach(function(obj) {
          expect(randomVals).to.include(obj[prop]);
        });
      });

      it('returns all properties', function() {
        var props = Object.keys(test.sampleData());
        var resultProps = Object.keys(context.data[0]);
        expect(resultProps).to.have.length.of.at.least(props.length);
        props.forEach(function(p) {
          expect(resultProps).to.include(p);
        });
      });
    });

    describe('GET?expand', function() {
      var randomVals = ['one', 'two', 'three', 'four', 'five'];
      var prop = Object.keys(test.sampleData())[0];
      
      before(function(done) {
        init(function() {
          var makeSample = function(val) {
            var obj = test.sampleData();
            obj[prop] = val;
            return obj;
          };
          var models = randomVals.map(makeSample);
          test.create(models, done);
        });
      });

      after(reset);

      it('returns only prop asked for', function(done) {
        var url = test.url + '?expand=' + prop;
        client.get(url, function(err, req, res, data) {
          done();
        });
      });

      it('returns multiple props when multiple are provided', function(done) {
        var props = Object.keys(test.sampleData());
        if (props.length == 1) { return done(); }

        var expectedProps = [prop, props[1]];
        var propString = expectedProps.join(',');

        var url = test.url + '?expand=' + propString;
        client.get(url, function(err, req, res, data) {
          expectedProps.push('_id');
          var resultProps = Object.keys(data[0]);
          resultProps.forEach(function(p) {
            expect(expectedProps).to.include(p);
          });
          done();
        });
      });

      it ('returns props except excluded when expand string contains exclusion', function(done) {
        var url = test.url + '?expand=-' + prop;
        client.get(url, function(err, req, res, data) {
          var resultProps = Object.keys(data[0]);
          var expectedProps = Object.keys(test.sampleData()).filter(function(k) { return k != prop; });
          expect(resultProps).not.to.include(prop);
          expectedProps.forEach(function(p) {
            expect(resultProps).to.include(p);
          });
          done();
        });
      });
    });

    describe('POST', function() {
      it('is alive');
    });
  });

  describe(test.url + '/:id', function() {
    describe('GET', function() {
      it('is alive');
    });

    describe('PUT', function() {
      it('is alive');
    });

    describe('DELETE', function() {
      it('is alive');
    });
  });
});