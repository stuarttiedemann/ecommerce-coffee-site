var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
// Setup our Schema
var Account = new Schema({
	username:String,
	password:String,
	grind:String,
	frequency:String,
	quarterPounds:Number,
	name:String,
	address1:String,
	address2:String,
	city:String,
	state:String,
	zipcode:Number,
	datepicker:String,
	accessLevel:Number,
	date:String
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);