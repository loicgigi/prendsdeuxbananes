var http = require('http');

var port = process.env.PORT || 8080;

module.exports = {
	getAllQuotes: function(callback) {
		var req = http.request({
			hostname: 'localhost',
			port: port,
			path: '/api/quotes'
		}, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON : ', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
 
		req.end();
	},

	getRandomQuote: function(callback) {
		var req = http.request({
			hostname: 'localhost',
			port: port,
			path: '/api/quotes/rand'
		}, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
 
		req.end();
	},
 
 	getNextQuote: function(idQuote, callback) {
		var path = '/api/quotes/' + idQuote + '/next';

		var req = http.request({
			hostname: 'localhost',
			port: port,
			path: path
		}, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
 
		req.end();
	},

	 getQuoteById: function(idQuote, callback) {
		var path = '/api/quotes/' + idQuote;

		var req = http.request({
			hostname: 'localhost',
			port: port,
			path: path
		}, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
 
		req.end();
	},

	post: function(params, callback) {
		
		var bodyString = JSON.stringify(params);
		
		var req = http.request({ 
  			hostname: 'localhost',
			port: port,
			path: '/api/quotes',
			headers: {
    			'content-type': "application/json",
			    'Content-Length': bodyString.length
			},
			method: 'POST'
		}, function (res) {
			var data = '';

			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
		req.write(bodyString);
 
		req.end();
	},

	delete: function(idQuote, callback) {
		
		var path = '/api/quotes/' + idQuote;

		var req = http.request({
			hostname: 'localhost',
			port: port,
			path: path,
			method: 'DELETE'
		}, function(res) {
			var data = '';
			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
 
		req.end();
	},

	put: function(params, callback) {
		
		var bodyString = JSON.stringify(params, ['increment']);
		var path = '/api/quotes/' + params.idQuote;
		
		var req = http.request({ 
  			hostname: 'localhost',
			port: port,
			path: path,
			headers: {
    			'content-type': "application/json",
			    'Content-Length': bodyString.length
			},
			method: 'PUT'
		}, function (res) {
			var data = '';

			res.on('data', function(chunk) {
				data += chunk;
			});
 
			res.on('end', function() {
				var responseObject = '';
				try {
					 responseObject = JSON.parse(data);
            	} catch (err) {
                	console.error('Unable to parse response as JSON', err);
                	return callback(err);
	            }
				return callback(responseObject);
			})
			.on('error', function(err){
					console.error('error with the request', err.message);
					return callback(err);
			});
		});
		req.write(bodyString);
 
		req.end();
	}
};