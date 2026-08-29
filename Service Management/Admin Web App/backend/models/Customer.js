const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true,
    unique: true
  },
  alternateMobile: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  appliances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appliance'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);
