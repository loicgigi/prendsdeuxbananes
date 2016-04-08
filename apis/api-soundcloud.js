var http = require('http');
 
module.exports = {
	getNextTracks: function(callback) {
		var req = http.request({
			hostname: 'api-widget.soundcloud.com',
			port:'80',
			path: '/tracks?ids=39457452%2C171910102%2C81780701%2C109105780%2C152800710%2C41000144%2C118264657%2C46781188%2C194335263%2C157835830&playlistId=26128114&format=json&client_id=a3e059563d7fd3372b49b37f00a00bcf&callback=?'
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