/*jshint strict: false*/
/* jshint node: true */

var http = require('http');

//var fs = require('fs');

//var ent = require('ent');

var express = require('express');

var app = express();

var server = http.createServer(app);

var mongoose = require('mongoose');

require('dotenv').load();

mongoose.connect(process.env.MONGO_URI, function(err) {
  if (err) { throw err; }
});

/* initialise le nombre de likes */
var citation = {
	id: "0",
	auteur: 'loic belot',
	texte: 'salut les blaireaux',
	date: new Date(99, 5, 24),
	nombreLikes: 0
};


app.use(function(req, res, next) {
		if (citation.id === undefined) {
			throw "erreur";
		}
		next();

		/* AJOUTER TESTS SUR CITATION */


		/* fs.readFile('./index.html', 'utf-8', function(error, content) {

        res.writeHead(200, {"Content-Type": "text/html"});

        res.end(content);
    });     */

	})
	.get('/', function(req, res) {
		res.render('index.ejs', {
			citation: citation
		});
	});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {

	console.log('Un client est connecté !');
	socket.on('disconnect', function() {
		console.log('Un client est déconnecté !');
	});

	socket.on('like', function(message) {
		console.log('citation likee numero : ' + message);
		citation.nombreLikes++;
		io.emit('modifierNombreLikes', citation.nombreLikes);
	});

	socket.on('unlike', function(message) {
		citation.nombreLikes--;
		io.emit('modifierNombreLikes', citation.nombreLikes);
	});
});

server.listen(8080);