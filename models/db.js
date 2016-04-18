// configure the app to use .env file
require('dotenv').config({silent: true});

var mongoose = require('mongoose');

// configure mongoose : uncomment for debug only
mongoose.set('debug', DEBUG);

var mongoUrl = '';

if (process.env.MONGO_URL) {
	mongoUrl = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@' + process.env.MONGO_URL;
} else {
	mongoUrl = 'mongodb://localhost:27017/prendsdeuxbananes';
}

if (DEBUG) {
	var mongoUrlDebug = process.env.MONGO_URL || 'localhost:27017/prendsdeuxbananes';
	console.log('Database selected is :', mongoUrlDebug);
}

// connection to MongoDB
mongoose.connect(mongoUrl, function(err) {
	if (err) {
		throw err;
	}
	console.log('Server event : connection to database successfull');
});

// require the Quote Model
// var QuoteModel = require('./../models/quote');