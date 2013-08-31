var expect          = require('chai').expect;
var moment          = require('moment');
var helper          = require('../test-helper')();
var SchoolCalendar  = require('../../lib/school-calendar');

describe('SchoolCalendar', function() {
  var cal;
  var config;

  before(function(done) {
    config = helper.config.generateCalendar().value;
    cal = SchoolCalendar.create(config);
    done();
  });

  it("can be created", function() {
    var foo = SchoolCalendar.create({years:{},classes:{}});
    expect(foo).to.exist;
  });

  it("gets a school year by name", function() {
    var y = cal.getYear("current");
    expect(y).to.exist;
  });

  it("converts text date to moment with beginning and end of day times", function() {
    var y = cal.getYear('current');
    expect(y.startDate).to.eql(moment(config.years.current.startDate));
    expect(y.endDate).to.eql(moment(config.years.current.endDate).endOf('day'));
  });

  it("calculates the current school year", function() {
    var y = cal.currentYear();
    expect(y).to.equal('current');
  });

  it("calculates grade level for a graduating class", function() {
    expect(cal.gradeLevel('firstGrade')).to.equal(1);
    expect(cal.gradeLevel('secondGrade')).to.equal(2);
  });

  it("returns grade level 0 if graduating class not found", function() {
    expect(cal.gradeLevel('unknown')).to.equal(0);
  });
});
