/*jshint strict: false*/
/*jshint node: true*/
/*jshint -W030 */
// above code ignore 'DEBUG &&' prepend warning */

// configure the app to use .env file
require('dotenv').config({silent: true});

// set the DEBUG global variable for the app and MONGO
if ( typeof DEBUG === "undefined" ) DEBUG = true; 

// process.env.PORT is automatically set by host (ex: heroku)
var port = process.env.PORT || 8080;

var soundcloudClientIdServer = process.env.SOUNDCLOUD_CLIENT_ID_SERVER;

//var serverIP = process.env.SERVER_IP || 'localhost';

var http = require('http');

//var fs = require('fs');

//var ent = require('ent');

var logger = require('./utils/logger');

var express = require('express');	

var app = express();

var session = require('express-session');

var MongoStore = require('connect-mongo')(session);

var sharedsession = require("express-socket.io-session");

var mongoose = require('mongoose');

//collects logs from server, such as requests. 
var morgan = require('morgan');

var server = http.createServer(app);

var bodyParser = require('body-parser');

var jsonQuery = require('json-query');

var io = require('socket.io').listen(server);

var favicon = require('express-favicon');

// require database connection
var db = require('./models/db');

// require API server 
var quotes = require('./controllers/quotes');

// require API client
var apiPrendsDeuxBananes = require('./apis/api-prendsdeuxbananes');

// require API soundcloud
var apiSoundcloud = require('./apis/api-soundcloud');

// configure logger
logger.debug("Overriding 'Express' logger");
app.use(morgan('dev', { "stream": logger.stream }));

//app.use(morgan('common', { skip: function(req, res) { return res.statusCode < 400 }, stream: __dirname + '/../morgan.log' }));

// sets the views folder as root for serving static files
app.use(express.static(__dirname + '/public'));

app.use(favicon(__dirname + '/public/images/prends-deux-bananes-disco-house-music-player-icone.ico'));

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());			// to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

// deprecated
/*app.use(express.json());
app.use(express.urlencoded());*/

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

// insert a quote in database when a user connects (for debug only)
/*if (DEBUG) {
	app.use (function (req, res, next) {
		
			var params = {
				author: 'test author',
				content: 'test content'
			};

			// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
			apiPrendsDeuxBananes.post(params, function(result) {
					console.log('post test quote in database success');
					console.log('------------------------------');
					console.log(result);
					console.log('------------------------------');
			});

			next();
	});
}*/

// make session variable available in express
app.use(sessionMiddleware);

// make the date pretty for display
function prettifyDate (stringDate) {
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	date = new Date(stringDate);
	var prettyDate = monthNames[date.getMonth()] + ' ' + date.getFullYear();
	return prettyDate; 
}

// get the playlist ID that will be played
function getPlaylist (req, res, next) {
	var params = {
		clientId: soundcloudClientIdServer,
		playlistTitle: process.env.SOUNDCLOUD_PLAYLIST_ROOT
	};


	// Resolves the playlist ID from playlist name and stores it in session
	apiSoundcloud.getPlaylistId(params, function(playlist) {

		// regex to find the playlist ID within URL
		var regex = /[playlists]+\/(\w+)/.exec(playlist.location);

		// store the ID found in URL
		req.session.currentPlaylistId = regex[1];


		if (DEBUG) {
			console.log('connection from %s : playlist ID stored in session', req.ip);
			console.log(req.session);
			console.log('------------------------------');
		}

		next();	
	});
}

// get the quote that will be displayed
function getQuote (req, res, next) {

	// initialize the likedQuotes array in Sessions variable if necessary (ie. if it's user's first connection)
	if (typeof(req.session.likedQuotes) == 'undefined') {
    	
    	// init liked array
    	req.session.likedQuotes = [];

		if (DEBUG) {
			console.log('Connection from %s : session likedQuotes array initialized empty. Session object :', req.ip);
			console.log(req.session);
			console.log('------------------------------');
		}
	}
	// do nothing
	else {
		if (DEBUG) {
			console.log('Connection from %s : session already defined :', req.ip);
			console.log(req.session);
			console.log('------------------------------');
		}
	}

	// if no currentQuote stored in session
	if (typeof(req.session.currentQuoteId) == 'undefined') {
    	// get a random quote
		apiPrendsDeuxBananes.getRandomQuote(function(quote) {

			if (DEBUG) {
				console.log('Connection from %s : no quote was found in session, get Random Quote : ', req.ip);
				console.log(quote);
				console.log('------------------------------');
			}

			// if a quote was found in database
			if (quote) {
				// store in session variable only the quote ID
				req.session.currentQuoteId = quote._id;

				// store the quote informations for display
				req.quote = quote;

				// format date for display
				req.quote.date = prettifyDate(req.quote.date);

				if (DEBUG) {
					console.log('Connection from %s : random quote stored in session : ', req.ip);
					console.log(req.session);
					console.log('------------------------------');
				}
			} 
			// if NO quote was found in database, display message
			else {
				req.quote = {
					author: 'prendsdeuxbananes',
					content: 'will provide you some funny artists quotes',
				};

				if (DEBUG) {
					console.log('Connection from %s : no quote was found in database. Display message : ', req.ip);
					console.log(req.quote);
					console.log('------------------------------');
				}

			}

			next();
		});
	}
	// A currentQuote was stored in session
	else {
		// retrieve quote metadatas from quote ID 
    	apiPrendsDeuxBananes.getQuoteById(req.session.currentQuoteId, function(quote) {

    		// if the function returned a quote
    		if(quote !== null) {

				if (DEBUG) {
					console.log('Connection from %s : current quote found in session :\n', req.ip, quote);
					console.log('------------------------------');
				}

				// store the quote informations for display
				req.quote = quote;

				// format date for display
				req.quote.date = prettifyDate(req.quote.date);
			
				// determines if the user already liked the chosen quote or not, in order to display to user the like button or not
				var lookup = jsonQuery(['likedQuotes[_id=?]', req.session.currentQuoteId], { data: req.session});
				if (lookup.value !== null) {
					req.quote.liked = lookup.value.liked === true ? true : false ;		
				} else {
					req.quote.liked = false;
				}

				if (DEBUG) {
					console.log('Connection from %s : current quote already liked : %s', req.ip, req.quote.liked);
					console.log('Quote object sent :\n', req.quote);
					console.log('------------------------------');
				}

			next();

			// the currentQuote had been destroyed
    		} else {
    		
    			// get a random quote
				apiPrendsDeuxBananes.getRandomQuote(function(quote) {

					if (DEBUG) {
						console.log('Connection from %s : quote was found in session but does not exist anymore in database, get Random Quote : ', req.ip);
						console.log(quote);
						console.log('------------------------------');
					}

					// if a quote was found in database
					if (quote) {
						// store in session variable only the quote ID
						req.session.currentQuoteId = quote._id;

						// store the quote informations for display
						req.quote = quote;

						// format date for display
						req.quote.date = prettifyDate(req.quote.date);

						if (DEBUG) {
							console.log('Connection from %s : random quote stored in session : ', req.ip);
							console.log(req.session);
							console.log('------------------------------');
						}
					} 
					// if NO quote was found in database, display message
					else {
						req.quote = {
							author: 'prendsdeuxbananes',
							content: 'will provide you some funny artists quotes',
						};

						if (DEBUG) {
							console.log('Connection from %s : no quote was found in database. Display message : ', req.ip);
							console.log(req.quote);
							console.log('------------------------------');
						}

					}

					next();
				});
    		}

		});		
    }
}

/*function loadUser(req, res, next) {
  if (req.session.email) {
    User.findById(req.session.email, function(user) {
      if (user) {
        req.currentUser = user;
        next();
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/');
  }
}*/

// send the page to display
app.get('/', getQuote, getPlaylist, function(req, res) {

	// check if user already logged
	sess = req.session;
	var logged = false;

	if(sess.email) {
		var logged = true;
	}
	
	if (DEBUG) {
		console.log('Connection from %s : user already logged : %s', req.ip, logged);
	}
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
	// require html page and send the quote chosen before (see in app.use) and the playlist to play
	res.render('pages/index', {
		quote: req.quote,
		playlistTitle: process.env.SOUNDCLOUD_PLAYLIST_ROOT, 
		logged: logged
	});
});

// redirects user when login required.
// Note : redirecting is the best practice, so that when he hits the back button in browser, he can move back seamlessly without getting any "POST required" popup
// TODO : use passport and socket.io  
/*   passport.authenticate('local-login', {
        successRedirect : 'back ou /admin',
        failureRedirect : 'back', // redirect back to the previous page
        failureFlash : true
    })*/

app.post('/login', function(req,res){

	var email=req.body.email,
      password=req.body.password;

	if (DEBUG) {
		console.log('connection from %s : logging attempt with %s %s', req.ip, email, password);
		console.log(req.session);
		console.log('------------------------------');
	}
	

	if (email == 'loic.girou@gmail.com') {
		req.session.email = email;
	    res.redirect('/admin');
	} else {
	    res.redirect('/');
	}


/*  if(isAuthorized(username,password)) { 
    req.session.authorized=true;
  }
    // display an error message to user
    // and redirect back to the login form
  else {
  }*/



})

.get('/admin', function(req,res){
  	
  	sess = req.session;


	if(sess.email) {
		if (DEBUG) {
			console.log('connection from %s to admin page authorized', req.ip);
			console.log(req.session);
			console.log('------------------------------');
		}
		/*res.write('<h1>Hello ' + sess.email + '</h1>');
		res.end('<a href="/logout">Logout</a>');*/

		apiPrendsDeuxBananes.getAllQuotes(function(quotes) {
	      res.render('pages/admin', {
	        quotes: quotes
	      });
	    });

	} else {
	    res.redirect("/");
	}
})

.get('/admin-add', function (req, res) {

  	sess = req.session;

	if(sess.email) {
		if (DEBUG) {
			console.log('connection from %s to admin page authorized', req.ip);
			console.log(req.session);
			console.log('------------------------------');
		}
    	res.render('pages/admin-add');
	}  else {
	    res.redirect("/");
	}
})

.post('/admin-add', function (req, res) {
    var data = req.body;

	var params = {
		author: req.body.author,
		content: req.body.content,
		date: req.body.date
	};

	// API CALL to post a new quote in database. Returns if success.
	apiPrendsDeuxBananes.post(params, function(result) {
			console.log('Post quote in database : ');
			console.log('------------------------------');
			console.log(result);
			console.log('------------------------------');
	});

    res.redirect('/admin');
})

.get('/admin/:quote', function (req, res) {

	// retrieve quote metadatas from quote ID 
	apiPrendsDeuxBananes.getQuoteById(req.params.quote, function(quote) {

	  	sess = req.session;

		if(sess.email) {
			if (DEBUG) {
				console.log('connection from %s to admin page authorized', req.ip);
				console.log(req.session);
				console.log('------------------------------');
			}
	      res.render('pages/admin-view.ejs', {
	        quote: quote
	      });
		}  else {
	    	res.redirect("/");
		}
	
	});
})

.get('/admin/:quote/delete', function (req, res) {
	
	// API CALL to delete the quote from database. Returns if success.
	apiPrendsDeuxBananes.delete(req.params.quote, function(result) {
		if (DEBUG) {
			console.log('Delete quote from database : ');
			console.log(result);
			console.log('------------------------------');
		}
	});

    res.redirect('/admin');
})

.get('/logout',function(req,res){
	
	req.session.destroy(function(err) {
		if(err) {
		console.log(err);
		} 
		/*else {
		res.redirect('/');
		}*/
	});

    res.redirect('/');
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

// Socket events handler
io.sockets.on('connection', function(socket) {


	// connect event captured
	console.log('Connection to Socket from %s', socket.handshake.address);

	// disconnect event captured
	socket.on('disconnect', function() {	
		console.log('Disconnection to Socket from %s : ', socket.handshake.address);
	});

	// Quotes Events Handler

	// Capture event : quote liked by user
	socket.on('likeQuote', function(idQuote) {

		if (idQuote) {
			var canUpdateDatabase = false;

			// check in the session variable if the user already liked this quote
			var lookup = jsonQuery(['likedQuotes[_id=?]', idQuote], { data: socket.handshake.session});

			// an entry already exists for this quote in the liked array of the user's session
			if (lookup.value !== null) {

				// the user did not already liked this quote
			    if (lookup.value.liked === false) {
					// store in 'session' variable that the user liked this quote
					socket.handshake.session.likedQuotes[lookup.key].liked = true;
					canUpdateDatabase = true;
					if (DEBUG) {
						console.log('Like quote %s from %s : session object updated :', idQuote, socket.handshake.address);
						console.log(socket.handshake.session);
						console.log('------------------------------');
					}

				// the user already liked this quote
			    } else {
			    	// do nothing
					console.log('Like attempt on quote %s from %s  : ', idQuote, socket.handshake.address);			
					console.log('but already liked ! Session object not updated :\n', socket.handshake.session);			
					console.log('------------------------------');
				}

			// no entry exists for this quote in the liked array of the user's session
			} else {
				// store in 'session' variable that the user liked this quote
				socket.handshake.session.likedQuotes.push({"_id":idQuote, "liked":true});
				canUpdateDatabase = true;
				if (DEBUG) {
					console.log('Like quote %s from %s : session object updated :', idQuote, socket.handshake.address);
					console.log(socket.handshake.session);
					console.log('------------------------------');
				}
			}

			if (canUpdateDatabase) {

				// set up update params
				var params = {
					'idQuote': idQuote,
					increment: 1
				};

				// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
				apiPrendsDeuxBananes.put(params, function(quoteUpdated) {
					if (DEBUG) {
						console.log('Server event : new like recorded in database for quote :\n', quoteUpdated);
						console.log('------------------------------');
					}

					// Display updated total amount of likes for ALL connected clients
					io.emit('updataQuoteLikesAmout', quoteUpdated.likes);
				});
			}
			// déconnexion de la base de données
			//mongoose.connection.close();
		}
	});

	// Capture event : quote unliked by user
	socket.on('unlikeQuote', function(idQuote) {

		if (idQuote) {

			// check in the session variable if the user already liked this quote
			var lookup = jsonQuery(['likedQuotes[_id=?]', idQuote], { data: socket.handshake.session});

			var canUpdateDatabase = false;

			// an entry already exists for this quote in the liked array of the user's session
			if (lookup.value !== null) {
			
				// the user already liked this quote	
			    if (lookup.value.liked === true) {
					// store in 'session' variable that the user unliked this quote
					socket.handshake.session.likedQuotes[lookup.key].liked = false;
					canUpdateDatabase = true;
					if (DEBUG) {
						console.log('Unlike quote %s from %s : session object updated :', idQuote, socket.handshake.address);
						console.log(socket.handshake.session);
						console.log('------------------------------');
					}

			    } else {
					console.log('Unlike attempt on quote %s from %s  : ', idQuote, socket.handshake.address);			
					console.log('but already unliked ! Session object not updated :\n', socket.handshake.session);			
					console.log('------------------------------');			
				}
			} else {		
				console.log('Unlike attempt on quote %s from %s  : ', idQuote, socket.handshake.address);			
				console.log('but never liked ! Session object not updated :\n', socket.handshake.session);			
				console.log('------------------------------');			
			}
			
			if (canUpdateDatabase) {

				// set up update params
				var params = {
					'idQuote': idQuote,
					increment: -1
				};

				// API CALL to increment  total amount of likes for this quote. Returns the quote updated from the database.
				apiPrendsDeuxBananes.put(params, function(quoteUpdated) {
					if (DEBUG) {
						console.log('Server event : new unlike recorded in database for quote :\n', quoteUpdated);
						console.log('------------------------------');				}

					// Display updated total amount of likes for ALL connected clients
					io.emit('updataQuoteLikesAmout', quoteUpdated.likes);
				});
			}

			// déconnexion de la base de données
			//mongoose.connection.close();
		}
	});

	// Capture event : next quote required by user  
	socket.on('nextQuote', function(idQuote) {
		if (idQuote) {

			console.log('Next quote of %s request from %s', idQuote, socket.handshake.address);
	    	
	    	apiPrendsDeuxBananes.getNextQuote(idQuote, function(quote) {

				// format date for display
				quote.date = prettifyDate(quote.date);

				if (DEBUG) {
					console.log('New quote sent : ');
					console.log(quote);
					console.log('------------------------------');
				}

				// store in session variable only the quote ID
				socket.handshake.session.currentQuoteId = quote._id;

				if (DEBUG) {
					console.log('Session object updated with new quote ID : ');
					console.log(socket.handshake.session);
					console.log('------------------------------');
		 		}

		 		// TODO : make a specific function as this code block already defined when loading the page
				// check in the session variable if the user already liked this quote
				var lookup = jsonQuery(['likedQuotes[_id=?]', socket.handshake.session.currentQuoteId], { data: socket.handshake.session});
				if (lookup.value !== null) {
					quote.liked = lookup.value.liked === true ? true : false ;
				} else {
					quote.liked = false;
				}

				if (DEBUG) {
					console.log('Connection from %s : current quote already liked : %s', socket.handshake.address, quote.liked);
					console.log('Quote object sent :\n', quote);
					console.log('------------------------------');
				}

				// Display new quote for the client that requested it only
				socket.emit('displayNewQuote', quote);

			});

			// TODO : déconnexion de la base de données
			//mongoose.connection.close();

		}
	});

	// Tracks Events Handler

	// Capture event : next list of tracks required by user. User sends tracks ID, this function resolves names and artists and send back metadatas to user.  
	socket.on('nextTracks', function(tracksIds) {

		console.log('Next tracks list of playlist %s request from %s', socket.handshake.session.currentPlaylistId, socket.handshake.address);

		var params = {
			tracksIds: tracksIds,
			playlistId: socket.handshake.session.currentPlaylistId,
			clientId: soundcloudClientIdServer
		};

    	// returns next tracks title and artist (json array returned) 
		apiSoundcloud.getNextTracks(params, function(nextTracks) {

			// Keep only relevant informations (ie. title and artist) to send back to user
			var nextTracksFormated = nextTracks.map(function(obj, index){ 
			  	var rObj = {};
				rObj.title = obj.title; 
				rObj.artist = obj.user.username; 
				rObj.id = obj.id;  
				return rObj;
			});

			if (DEBUG) {
				console.log('Next tracks list sent to %s', socket.handshake.address);
				console.log(nextTracksFormated);
				console.log('------------------------------');
			}

			// Display new tracks for the client that requested it only
			socket.emit('displayNewTracks', nextTracksFormated);
		});
	});

});

server.listen(port, function() {
    //console.log('Our app is running on port :' + port);
	console.log('Server app listening on http://%s:%s',server.address().address, server.address().port);
});

/*, function(){
 //Listening on port 8888
}*/