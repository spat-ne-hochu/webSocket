var mysql = require('mysql');

var _options = {
	host: 'aliveburg.local',
	user: 'root',
	password: '55637184',
	database: 'aliveburg'
};

var _instance = null;

function _getInstance() {
	if (_instance === null) {
		_instance = mysql.createConnection(_options);
		_instance.connect();
	}
	return _instance;
}

function query (query, callback) {
	_getInstance().query(query, function (err, rows, fields) {
		callback(err, rows, fields);
	});
}

exports.query = query;
