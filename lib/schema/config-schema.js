var mongoose  = require('mongoose');
var Schema    = mongoose.Schema;

var configSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: Schema.Types.Mixed
});

var model = mongoose.model('Config', configSchema);
module.exports = model;