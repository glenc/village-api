var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var phoneNumberSchema = new Schema({
  type: String,
  number: String
}, { _id: false });

var contactSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  type: { type: String, required: true, enum: ['Parent', 'Guardian'], default: 'Parent'},
  email: String,
  phoneNumbers: [phoneNumberSchema],
  address: {
    street1: String,
    street2: String,
    city: String,
    state: String,
    zip: String
  }
});

contactSchema.virtual("fullName").get(function(){
  if (this.firstName && this.lastName) {
    return this.firstName + ' ' + this.lastName;
  }
  if (this.firstName) return this.firstName;
  if (this.lastName) return this.lastName;
});

var familySchema = new Schema({
  name: { type: String, required: true, unique: true },
  contacts: [contactSchema]
});

familySchema.statics.findOneByName = function (name, callback) {
  this.findOne(
    {name: new RegExp(name, 'i')},
    callback
  );
};

var model = mongoose.model('Family', familySchema);
module.exports = model;