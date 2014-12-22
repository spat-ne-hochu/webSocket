var usersService = require("./services/users/users");

function start(response) {
	console.log("Request handler 'start' was called.");

	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write("Hello Start");
	response.end();
}

function upload(response) {
	console.log("Request handler 'upload' was called.");
	response.writeHead(200, {"Content-Type": "text/plain"});
	response.write("Hello Upload");
	response.end();
}

function users(response) {
	console.log("Request handler 'users' was called.");
	usersService.getUserById(1, function(err, rows) {
		if (err === null) {
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(JSON.stringify(rows));
		} else {
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write('Server error');
		}
		response.end();
	});
}

exports.start = start;
exports.upload = upload;
exports.users = users;