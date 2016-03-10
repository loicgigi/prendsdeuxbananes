/*jshint strict: false*/
/* jshint node: true */

var http = require('http');

//var fs = require('fs');

//var ent = require('ent');

var express = require('express');

var app = express();

var server = http.createServer(app);

var mongoose = require('mongoose');

// seulement nécessaire lorqu'on n'utilise pas les fonctions mongoose
//var ObjectId = require('mongodb').ObjectID;

// pour debug seulement
mongoose.set('debug', true);

require('dotenv').load();

// connexion à la base de données MongoDB
mongoose.connect(process.env.MONGO_URI, function(err) {
  if (err) { throw err; }
  console.log('evenement serveur : connexion à la base de données réussie');
});

// défition de la structure des données 'citation'
var citationSchema = new mongoose.Schema({
	auteur: String,
	texte: String,
	date: { type : Date, default : Date.now },
	nombreLikes: { type: Number, min : 0 }
});

// création de la table (modèle) 'citation' suivant la structuration définie
var CitationModel = mongoose.model('citations', citationSchema);

// ajout d'une citation (instance de modèle) dans le modèle
var maCitation = new CitationModel({ 
	auteur : 'loic2', 
	texte: 'il etait une fois',
	date: new Date(99, 5, 24),
	nombreLikes: 0
});

// Sauvegarde de la citation créée dans MongoDB
maCitation.save(function (err) {
  if (err) { throw err; }
  console.log('evenement serveur : citation créee avec succès !');
});

// fonction permettant de récupérer toutes les citations
function getAllCitations() {
	var query = CitationModel.find(null);
	return query;
}

/*
// récupérer et afficher les citations d'un auteur

function getCitationByID(id, callback) {
	CitationModel.findById(id, function (err, found) {
	    if (err) {
	        callback(err, null);
	    } else {
	    	//console.log(found._id);
			callback(null, found);
	    }
	});
}
*/

// fonction générique permettant d'ajouter ou supprimer un like d'une citation
function updateLikesCitation(id, increment, callback) {
	CitationModel.findByIdAndUpdate(id, {$inc: {nombreLikes: increment}}, { multi : false, new : true },  function (err, data) {
  	    if (err) {
	        callback(err, null);
	    } else {
	    	//console.log(found._id);
			callback(null, data);
	    }
	});
}

app.use(function(req, res, next) {

		/* AJOUTER TESTS SUR CITATION */
		next();



		/* fs.readFile('./index.html', 'utf-8', function(error, content) {

        res.writeHead(200, {"Content-Type": "text/html"});

        res.end(content);
    });     */

	})

	// à la connexion d'un client, récupération de TOUTES les citations disponibles en BDD
	.get('/', function(req, res) {
		var query = getAllCitations();
		query.exec(function(err,citations){
		  	if (err) { throw err; }
		  	/*
		  	for (var i = 0; i < citations.length; i++) {
			    console.log('------------------------------');
			    console.log('ID : ' + citations[i]._id);
			    console.log('auteur : ' + citations[i].auteur);
			    console.log('texte : ' + citations[i].texte);
			    console.log('Date : ' + citations[i].date);
			    console.log('nombreLikes : ' + citations[i].nombreLikes);
			    console.log('------------------------------');
			}
			*/
			res.render('index.ejs', {
				citation: citations[0]
			});
		});
	});

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {

	console.log('evenement client : connexion');
	socket.on('disconnect', function() {
		console.log('evenement client : déconnexion');
	});

		// capture evenement clic sur bouton like d'une citation
		socket.on('like', function(idCitation) {
			console.log('evenement client : like citation numero : ' + idCitation);
			// incrementation nombre de likes en base de données 
			updateLikesCitation(idCitation, 1, function(err, citation) {
				if (err) {
		    		console.log(err);
		  		}
				// mise à jour du nombre de likes pour TOUS les clients
				io.emit('modifierNombreLikes', citation.nombreLikes);

				// déconnexion de la base de données
				//mongoose.connection.close();
			});
	/*
			getCitationByID(idCitation, function(err, citation) {
				if (err) {
		    		console.log(err);
		  		}
			});
					*/
		});

		// capture evenement clic sur bouton unlike d'une citation
		socket.on('unlike', function(idCitation) {
			console.log('evenement client : unlike citation numero : ' + idCitation);
			// décrementation nombre de likes en base de données 
			updateLikesCitation(idCitation, -1, function(err, citation) {
				if (err) {
		    		console.log(err);
		  		}
				// mise à jour du nombre de likes pour TOUS les clients
				io.emit('modifierNombreLikes', citation.nombreLikes);

				// déconnexion de la base de données
				//mongoose.connection.close();
			});
	/*		getCitationByID(idCitation, function(err, citation) {
				if (err) {
		    		console.log(err);
		  		}
				//console.log(citation.nombreLikes);
				io.emit('modifierNombreLikes', citation.nombreLikes);
			});
			*/
		});
});

server.listen(8080);