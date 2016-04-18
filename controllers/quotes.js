// require quote schema
var QuoteModel = require('../models/quote');

var express = require('express');

var router = express.Router();

// Get all quotes
router.route('/quotes')
	.get(function(req, res) {
		QuoteModel.find(function(err, quotes) {
			if (err) {
				res.send(err);
			}
			res.json(quotes);
		});
	})

// Create a new quote
.post(function(req, res) {
	if (req.body.author === undefined) {
		res.send('post quote : \'author\' field is required');
		throw 'post quote : \'author\' field is required';
	}
	if (req.body.content === undefined) {
		res.send('post quote : \'content\' field is required');
		throw 'post quote : \'content\' field is required';
	}

	var myQuote = new QuoteModel({
		author: req.body.author,
		content: req.body.content, 
		date: new Date(req.body.date),
	});

	console.log('Triying to insert quote : \n', myQuote);

	// Save quote in MongoDB
	myQuote.save(function(err) {
		if (err) {
			res.send(err);
		}
		res.json({
			message: 'Citation créée avec succès !'
		});
		console.log('evenement serveur : citation créee avec succès !');
	});
});

// Get random quote based on how many there are in the collection
// !! must be placed before the route matching :_id (see below).
router.route('/quotes/rand')
	.get(function(req, res) {
		QuoteModel.count(function(err, count) {
	    	var rand = Math.floor(Math.random() * count);
		    // !! skip inneficient on big databases
	    	QuoteModel.findOne().skip(rand).exec(function(err, quote) {
				if (err) {
					res.send(err);
				}
				res.json(quote);
			});
		});
	});

/*
		QuoteModel.random(function(err, quote) {
			if (err) {
				res.send(err);
			}
			res.json(quote);
		});
*/
router.route('/quotes/:quote_id')
	// Get one quote by ID
	.get(function(req, res) {
		QuoteModel.findById(req.params.quote_id, function(err, quote) {
			if (err) {
				res.send(err);
			}
			res.json(quote);
		});
	})

//add or remove 1 like by ID
.put(function(req, res) {
	if (req.body.increment != 1 && req.body.increment != -1) {
		res.send('alter quote : \'increment\' field must be 1 or -1');
		throw 'alter quote : \'increment\' field must be 1 or -1';
	}

	/*
			QuoteModel.findById(req.params.quote_id, function(err, quote) {
				if (err) {
					res.send(err);
				}
				quote.likes = parseInt(quote.likes) + parseInt(req.body.increment);
				quote.save(function(err) {
					if (err) {
						res.send(err);
					}
					res.json({
						"message-from-api": 'Number of likes modified',
						idQuote: req.params.quote_id,

					});
				});
			});

	*/

	/* a TESTER, + réduit en code */
	QuoteModel.findByIdAndUpdate(req.params.quote_id, {
		$inc: {
			likes: req.body.increment
		}
	}, {
		multi: false,
		new: true
	}, function(err, quote) {
		if (err) {
			res.send(err);
		}
		res.json(quote);
	});
})

//delete one quote by ID
.delete(function(req, res) {
	QuoteModel.remove({
		_id: req.params.quote_id
	}, function(err, quote) {
		if (err) {
			res.send(err);
		}
		res.json({
			message: 'Quote successfully deleted'
		});
	});
});

// Finds the 'next quote'
router.route('/quotes/:quote_id/next')
	.get(function(req, res) {
		QuoteModel.findOne().where('_id').gt(req.params.quote_id).exec(function(err, quote) {
			if (err) {
				res.send(err);
			}

			// if a quote is returned
		    if (quote) {
				res.json(quote);
		    } else {
		      	// If quote is null, meaning that we have reached the last quote, we take the first quote in the database
				QuoteModel.findOne(function(err, quote) {
					if (err) {
						res.send(err);
					}
					res.json(quote);
				});
		    }
		});
	});

// find the previous quote
// lt does not work : always display the first quote of the list
/*router.route('/quotes/:quote_id/previous')
	.get(function(req, res) {
		QuoteModel.findOne().where('_id').lt(req.params.quote_id).exec(function(err, quote) {
			if (err) {
				res.send(err);
			}

			// if a quote is returned
		    if (quote) {
				res.json(quote);
		    } else {
		      	// If quote is null, meaning that we have reached the last quote, we take the first quote in the database
				QuoteModel.findOne(function(err, quote) {
					if (err) {
						res.send(err);
					}
					res.json(quote);
				});
		    }
		});
	});
*/

module.exports = router;