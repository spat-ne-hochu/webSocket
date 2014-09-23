var server = require("./server");
var router = require("./router");
var handle = require("./requestHandlers");

var wsServer = require("./wsServer");

server.start(router.route, handle);












