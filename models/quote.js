var mongoose = require('mongoose');

// défition de la structure des données 'quote'
var QuoteSchema = new mongoose.Schema({
	author: String,
	content: String,
	date: { type : Date, default : Date.now },
	likes: { type: Number, min : 0, default: 0 }
});

module.exports = mongoose.model('QuoteModel', QuoteSchema);