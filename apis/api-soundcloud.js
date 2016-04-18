var http = require('http');
 
module.exports = {
	getNextTracks: function(params, callback) {
		var path = '/tracks?ids=' + params.tracksIds + '&playlistId=' + params.playlistId + '&format=json&client_id=' + params.clientId ;
		var req = http.request({
			hostname: 'api.soundcloud.com',
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
                	console.log(data);
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

	getPlaylistId: function(params, callback) {
		var path = '/resolve?url=https://soundcloud.com/prendsdeuxbananes/sets/' + params.playlistTitle + '&format=json&client_id=' + params.clientId ;
		var req = http.request({
			hostname: 'api.soundcloud.com',
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
                	console.log(data);
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
	}
};