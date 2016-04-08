/*jshint strict: false*/
/*jshint node: true*/
/*jshint -W030 */
// above code ignore 'DEBUG &&' prepend warning */

// set the DEBUG global variable for the app and MONGO
if ( typeof DEBUG === "undefined" ) DEBUG = true; 

var http = require('http');

//var fs = require('fs');

//var ent = require('ent');

var express = require('express');

var session = require('express-session');

var MongoStore = require('connect-mongo')(session);

var sharedsession = require("express-socket.io-session");

var mongoose = require('mongoose');

var app = express();

var server = http.createServer(app);

var bodyParser = require('body-parser');

var jsonQuery = require('json-query');

var io = require('socket.io').listen(server);

// require database connection
var db = require('./models/db');

// require API server 
var quotes = require('./controllers/quotes');

// require API client
var apiPrendsDeuxBananes = require('./apis/api-prendsdeuxbananes');

// require API soundcloud
var apiSoundcloud = require('./apis/api-soundcloud');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// configure the app to use controller api
app.use('/api', quotes);

// set the view engine to ejs
app.set('view engine', 'ejs');

// declare Session variable shared with express and socket.io. Session can be retrieved via req.session.
var sessionMiddleware = session({
    secret: "p2bsecret",
    resave: true, 
    saveUninitialized: true,
    cookie: {
    	httpOnly: false, // important to allow client to read session cookie with JavaScript
    	maxAge: 600000
    },
	store: new MongoStore({	mongooseConnection: mongoose.connection	})
});

// make session variable available in socket.io
io.use(sharedsession(sessionMiddleware, {
    autoSave:true // necessary so that we can update the session stored in mongo FROM socket.io
})); 

// make session variable available in express
app.use(sessionMiddleware)

// initialize the likedQuotes array if necessary
.use(function (req, res, next) {
	if (typeof(req.session.likedQuotes) == 'undefined') {
    	// init liked array
		if (DEBUG) {
			console.log('------------------------------');
			console.log('session likedQuotes array set as not already defined');
			console.log(req.session);
			console.log('------------------------------');
		}
    	req.session.likedQuotes = [];
	}
	else {
		if (DEBUG) {
			console.log('------------------------------');
			console.log('session likedQuotes array already defined');
			console.log(req.session);
			console.log('------------------------------');
		}
	}
	next();
})

// insert a quote in database
.use (function (req, res, next) {
	
		var params = {
			author: 'loicTest2',
			content: 'salutTest2'
		};

		// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
		apiPrendsDeuxBananes.post(params, function(result) {
			if (DEBUG) {
				console.log('------------------------------');
				console.log(result);
				console.log('------------------------------');
			}
		});

		next();
})

// get the quote that will be displayed
.use(function (req, res, next) {

	if (typeof(req.session.currentQuoteId) == 'undefined')
    {
    	// get a random quote
		apiPrendsDeuxBananes.getRandomQuote(function(quote) {

			if (DEBUG) {
				console.log('getRandomQuote for user : ');
				console.log('------------------------------');
				console.log(quote);
				console.log('------------------------------');
			}

			if (quote) {
				// store in session variable only the quote ID
				req.session.currentQuoteId = quote._id;

				// store the quote informations for display
				req.quote = quote;

				if (DEBUG) {
					console.log('Random quote stored in session : ');
					console.log('------------------------------');
					console.log(req.session);
					console.log('------------------------------');
				}
			} else {
				req.quote = {
					author: 'prendsdeuxbananes',
					content: 'quotes comming soon'
				};
			}

			next();
		});
	}
	else {
		// get currentQuoteID already stored in user session 
    	apiPrendsDeuxBananes.getQuoteById(req.session.currentQuoteId, function(quote) {

			if (DEBUG) {
				console.log('getQuoteById for Current quote');
				console.log('------------------------------');
				console.log(quote);
				console.log('------------------------------');
			}

			// store the quote informations for display
			req.quote = quote;

			if (DEBUG) {
				console.log('quote stored in session : ');
				console.log('------------------------------');
				console.log(req.session);
				console.log('------------------------------');
			}
			next();
		});		
    }
})

.use (function (req, res, next) {
    	// get a random quote
		apiSoundcloud.getNextTracks(function(nextTracks) {

			if (DEBUG) {
				console.log('getNextTracks for user : ');
				console.log('------------------------------');
				console.log(nextTracks);
				console.log('------------------------------');
			}
			next();
		});
})

// determines if the chosen quote is already liked or not
.use (function (req, res, next) {
	var lookup = jsonQuery(['likedQuotes[_id=?]', req.session.currentQuoteId], { data: req.session});
	if (lookup.value !== null) {
		req.quote.liked = lookup.value.liked === true ? true : false ;
	} else {
		req.quote.liked = false;
	}

	if (DEBUG) {
		console.log('temporary quote object that will be displayed : ');
		console.log('------------------------------');
		console.log(req.quote);
		console.log('------------------------------');
	}
	next();	
})

.get('/', function(req, res) {

/*
		if (DEBUG) {
			console.log('session object from Express containing list of quotes');
			console.log('------------------------------');
			req.session.views ? req.session.views++ : req.session.views = 1;
			console.log('number of views : ' + req.session.views);
			console.log('cookie : ');
			console.log(req.session.cookie);
			console.log('Cookie expires in ' + req.session.cookie.maxAge / 1000 + 'seconds');
			console.log('quotes tab : ');
			console.log(req.session.quotesTab);
			console.log('------------------------------');
		}
*/
	// require html page and display chosen quote
	res.render('pages/index', {
		quote: req.quote,
	});
})

// Basic 404 handler
.use(function (req, res) {
  res.status(404).send('Not Found');
})

// Basic error handler
.use(function (err, req, res, next) {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

// events handler
io.sockets.on('connection', function(socket) {


	// connect event captured
	console.log('evenement client : connexion au serveur réussie');

	if (DEBUG) {
		console.log('session object from Socket.io :');
		console.log('------------------------------');
		console.log(socket.handshake.session);
		console.log('------------------------------');
	}

	// disconnect event captured
	socket.on('disconnect', function() {
		console.log('evenement client : déconnexion du serveur réussie');
	});

	// Capture event : quote liked by user
	socket.on('like', function(idQuote) {

		// check in the session variable if the user already liked this quote
		var lookup = jsonQuery(['likedQuotes[_id=?]', idQuote], { data: socket.handshake.session});

		var canUpdateDatabase = false;

		if (lookup.value !== null) {
		// an entry already exists for this quote in the liked array of the user's session

		    if (lookup.value.liked === false) {
				// store in 'session' variable that the user liked this quote
				socket.handshake.session.likedQuotes[lookup.key].liked = true;
				canUpdateDatabase = true;
				if (DEBUG) {
					console.log('session object from socket.io updated :');
					console.log('------------------------------');
					console.log(socket.handshake.session);
					console.log('------------------------------');
				}

		    } else {
				console.log('client event : trying to like quote number : ' + idQuote);			
				console.log('but already liked !');			
			}
		} else {
			// store in 'session' variable that the user liked this quote
			socket.handshake.session.likedQuotes.push({"_id":idQuote, "liked":true});
			canUpdateDatabase = true;
			if (DEBUG) {
				console.log('session object from socket.io updated with one new like:');
				console.log('------------------------------');
				console.log(socket.handshake.session);
				console.log('------------------------------');
			}
		}

		if (canUpdateDatabase) {

			console.log('client event : like quote number : ' + idQuote);

			// set up update params
			var params = {
				'idQuote': idQuote,
				increment: 1
			};

			// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
			apiPrendsDeuxBananes.put(params, function(quoteUpdated) {
				if (DEBUG) {
					console.log('database event : new like recorded for quote : ');
					console.log('------------------------------');
					console.log(quoteUpdated);
					console.log('------------------------------');
				}

				// Display updated total amount of likes for ALL connected clients
				io.emit('modifierNombreLikes', quoteUpdated.likes);
			});
		}
		// déconnexion de la base de données
		//mongoose.connection.close();
	});

	// Capture event : quote unliked by user
	socket.on('unlike', function(idQuote) {

		// check in the session variable if the user already liked this quote
		var lookup = jsonQuery(['likedQuotes[_id=?]', idQuote], { data: socket.handshake.session});

		var canUpdateDatabase = false;

		if (lookup.value !== null) {
		// an entry already exists for this quote in the liked array of the user's session
			
		    if (lookup.value.liked === true) {
				// store in 'session' variable that the user unliked this quote
				socket.handshake.session.likedQuotes[lookup.key].liked = false;
				canUpdateDatabase = true;
				if (DEBUG) {
					console.log('session object from socket.io updated with one unlike:');
					console.log('------------------------------');
					console.log(socket.handshake.session);
					console.log('------------------------------');
				}

		    } else {
				console.log('client event : trying to unlike quote number : ' + idQuote);			
				console.log('but already unliked !');			
			}
		} else {		
			console.log('client event : trying to unlike quote number : ' + idQuote);			
			console.log('but never liked before !');			
		}
		
		if (canUpdateDatabase) {

			console.log('client event : unlike quote number : ' + idQuote);

			// set up update params
			var params = {
				'idQuote': idQuote,
				increment: -1
			};

			// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
			apiPrendsDeuxBananes.put(params, function(quoteUpdated) {
				if (DEBUG) {
					console.log('database event : unlike recorded for quote : ');
					console.log('------------------------------');
					console.log(quoteUpdated);
					console.log('------------------------------');
				}

				// Display updated total amount of likes for ALL connected clients
				io.emit('modifierNombreLikes', quoteUpdated.likes);
			});
		}

		// déconnexion de la base de données
		//mongoose.connection.close();

	});

	// Capture event : next quote required by user  
	socket.on('next', function(idQuote) {
		console.log('client event : request next quote of : ' + idQuote);
    	
    	apiPrendsDeuxBananes.getNextQuote(idQuote, function(quote) {

			if (DEBUG) {
				console.log('getNextQuote returned quote : ');
				console.log('------------------------------');
				console.log(quote);
				console.log('------------------------------');
			}

			// store in session variable only the quote ID
			socket.handshake.session.currentQuoteId = quote._id;

			if (DEBUG) {
				console.log('next quote stored in session object : ');
				console.log('------------------------------');
				console.log(socket.handshake.session);
				console.log('------------------------------');
	 		}

			// check in the session variable if the user already liked this quote
			var lookup = jsonQuery(['likedQuotes[_id=?]', socket.handshake.session.currentQuoteId], { data: socket.handshake.session});
			if (lookup.value !== null) {
				quote.liked = lookup.value.liked === true ? true : false ;
			} else {
				quote.liked = false;
			}

			if (DEBUG) {
				console.log('temporary quote object that will be displayed : ');
				console.log('------------------------------');
				console.log(quote);
				console.log('------------------------------');
			}

			// Display new quote for the client that requested it only
			socket.emit('displayNewQuote', quote);

		});

		// déconnexion de la base de données
		//mongoose.connection.close();

	});

});

server.listen(8080);

/*, function(){
    console.log('Listening on port ' + server.address().port); //Listening on port 8888
    console.log('at adress ' + server.address().adress); //Listening on port 8888
}*/