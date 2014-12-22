var http = require("http");
var url  = require("url");

function start(DI) {
	function onRequest(request, responce) {
		console.log(new Date().toUTCString() + ' \033[35m' + request.method + ' ' + request.url + '\033[39m');
		var client = {
			req: request,
			res: responce
		};
		DI.route(request.url + '/', DI, client, function(data) {
			responce.writeHead(200, {"Content-Type": "text/html"});
			responce.write(data);
			responce.end();
		});
	}

	http.createServer(onRequest).listen(80);
	console.log(new Date().toUTCString() + ' \033[33mServer has started.\033[39m');
}

exports.start = start;