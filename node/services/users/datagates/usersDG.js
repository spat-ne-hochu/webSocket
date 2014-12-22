var db = require("../../../lib/db/mysql/mysql");

var usersDG = {
	create: function () {

	},
	read: function (id, callback) {
		db.query('SELECT * FROM `users` WHERE id = ' + id, function (err, rows, fields) {
			callback(err, rows, fields);
		});
	},
	write: function (usersModel) {

	},
	'delete': function (usersModel) {

	},
	fetchAll: function(callback) {
		db.query('SELECT * FROM `users`', function (err, rows, fields) {
			callback(err, rows, fields);
		});
	}
};

exports.read = usersDG.read;
exports.fetchAll = usersDG.fetchAll;
