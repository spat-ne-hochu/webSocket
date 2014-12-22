var usersDG = require("./datagates/usersDG.js");

var service = {
	getUserById: function (id, callback) {
		usersDG.read(id, function(err, rows, fields) {
			callback(err, rows, fields);
		});
	},
	getAll: function(callback) {
		usersDG.fetchAll(function(err, rows, fields) {
			callback(err, rows, fields);
		});
	}

};

exports.getUserById = service.getUserById;
exports.getAll = service.getAll;
