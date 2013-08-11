var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var studentSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  family: { type: Schema.Types.ObjectId, ref: 'FamilySchema', required: true },
  graduatingClass: { type: String, required: true },
  gender: { type: String, required: true, enum: ['M', 'F'], default: 'M'}
});

var model = mongoose.model('Student', studentSchema);
module.exports = model;