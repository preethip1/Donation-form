var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var DetailsSchema = new mongoose.Schema({
    phoneNo: { type: String, unique: true, required: [true, "can't be blank"], index: true },
    address: String,
    amount: Number,
    donationDate: Date,
    email: String,
    name: String,
    payment: String,
    period: String,
    pincode: String,
    smirtiDate: Date,
}, { timestamps: true });

mongoose.model('Details', DetailsSchema);
