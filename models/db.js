// configure the app to use .env file
require('dotenv').load();

var mongoose = require('mongoose');

// configure mongoose : uncomment for debug only
mongoose.set('debug', DEBUG);


var mongoUrl = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@' + process.env.MONGO_URL || 'mongodb://localhost:27017/prendsdeuxbananes';

if (DEBUG) {
	console.log('database selected is :');
	console.log('------------------------------');
	console.log(mongoUrl);
	console.log('------------------------------');
}

// connection to MongoDB
mongoose.connect(mongoUrl, function(err) {
	if (err) {
		throw err;
	}
	console.log('server event : connection to database successfull');
});

// require the Quote Model
// var QuoteModel = require('./../models/quote');