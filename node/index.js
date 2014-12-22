var DI = require('./lib/di/di');
require('./bootstrap').init(DI);

var server = require("./server");

server.start(DI);

require("./wsServer");










