var crypto = require('crypto'),
	EMPTY_STRING = '',
	HTTP_EOL = '\r\n',
	HTTP_DELIMITER = HTTP_EOL + HTTP_EOL,
	HTTP_HEAD_DELIMITER = ': ',
	HTTP_SWITCHING_BEGIN = 	'HTTP/1.1 101 Switching Protocols' + HTTP_EOL +
							'Upgrade: websocket' + HTTP_EOL +
							'Connection: Upgrade' + HTTP_EOL +
							'Sec-WebSocket-Accept: ',
	HTTP_400 = 'HTTP/1.1 400 Bad Request' + HTTP_DELIMITER,
	WS_SALE = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

function getAcceptKeyFromHead (headString) {
	var headers = parseHttpHeaders(headString);
	if (headers.connection == 'Upgrade' && headers.upgrade == 'websocket') {
		return crypto.createHash('sha1').update(headers['sec-websocket-key'] + WS_SALE).digest('base64');
	}
	return false;
}

function parseHttpHeaders (head) {
	var headers = {};
	head.replace(HTTP_DELIMITER, EMPTY_STRING).split(HTTP_EOL).map(function(item) {
		var header = item.split(HTTP_HEAD_DELIMITER);
		headers[header[0].toLowerCase()] = header[1];
	});
	return headers;
}

var wsClients = [];

function sendAll(message, socket) {
	//console.log('Broadcast send: ' + message);
	for (var i in wsClients) {
		if (!wsClients.hasOwnProperty(i) || socket == wsClients[i]) {
			continue;
		}
		if (wsClients[i].writable) {
			//console.log(wsFrame(message));
			wsClients[i].write(wsFrame(message), function () {
			});
		}
	}
}

function wsFrame(message) {
	var mess = new Buffer(message);
	var buff = new Buffer(2);
	var ext;
	buff[0] = 0x81;
	if (mess.length < 126) {
		buff[1] = mess.length;
		ext = new Buffer(0);
	} else if(mess.length < 65536) {
		buff[1] = 126;
		ext = new Buffer(2);
		ext.writeUInt16BE(mess.length, 0);
	} else {
		buff[1] = 127;
		ext = new Buffer(8);
		ext.writeUInt32BE(mess.length >>> 32, 0);
		ext.writeUInt32BE(mess.length << 32, 4);
	}
	return Buffer.concat([buff, ext, mess]);
}


/*var WebSocketServer = */require('net').createServer(function (socket) {
	//socket.setNoDelay(true);
	//socket.setKeepAlive(false);
	console.log('connected ' + socket.remoteAddress + ':' + socket.remotePort);
	sendAll(socket.remoteAddress + ':' + socket.remotePort + ' пришел к нам');
	wsClients.push(socket);

	var readBuffer = EMPTY_STRING, messageLength, minLength, mask, isMask, offset, message, end, maxOffset;

	var httpUpgradeHandler = function (data) {
		console.log('upgrade handler');
		readBuffer += data.toString();
		if (readBuffer.indexOf(HTTP_DELIMITER) + 1) {
			var accept = getAcceptKeyFromHead(readBuffer.split(HTTP_DELIMITER)[0]);
			if (accept) {
				socket.write(HTTP_SWITCHING_BEGIN + accept + HTTP_DELIMITER);
				//console.log('switch to ws');
				prepareWsHeadHandler();
				socket.on('data', wsHeadHandler);
				socket.removeListener('data', httpUpgradeHandler);
				readBuffer = EMPTY_STRING;
			} else {
				socket.write(HTTP_400);
				socket.close();
			}
		}
		if (readBuffer.length > 65536) {
			socket.write(HTTP_400);
			socket.close();
		}
	};

	var prepareWsHeadHandler = function () {
		console.log('prepareWsHeadHandler');
		messageLength = mask = minLength = null;
		isMask = false;
		offset = 0;
		readBuffer = EMPTY_STRING;
	};

	var wsHeadHandler = function (data) {
		console.log('wsHeadHandler, length: ', data, data.length);
		readBuffer = (!readBuffer) ? data : Buffer.concat([readBuffer, data]);

		if (!minLength && readBuffer.length >= 2) {
			isMask = (readBuffer[1] & 128) == 128;
			//console.log('isMask', isMask);
			minLength = readBuffer[1] & 127;
			if (minLength < 126) {
				messageLength = minLength;
				console.log('messageLength: ', messageLength);
			}
			offset+=2;
		}

		if (messageLength === null) {
			if (minLength == 126 && readBuffer.length >= 4) {
				messageLength = readBuffer.readUInt16BE(2);
				console.log('messageLength: ', messageLength);
				offset+=2;
			}
			if (minLength == 127 && readBuffer.length >= 10) {
				messageLength = readBuffer.readUInt32BE(2) * 0xFFFFFFFF + readBuffer.readUInt32BE(6);
				console.log('messageLength: ', messageLength);
				offset+=8;
			}
		}

		//console.log( isMask, mask === null, readBuffer.length, offset+4, readBuffer.length >= (offset + 4) );
		if (isMask && mask === null && readBuffer.length >= (offset + 4)) {
			mask = readBuffer.readUInt32BE(offset);
			//console.log('mask: ', mask);
			offset+=4;
		}

		if (messageLength !== null && (isMask && mask !== null || !isMask)) {
			// Все круто переключаемся на обработку самого тела

			var buffer = readBuffer.slice(offset);
			readBuffer = EMPTY_STRING;
			socket.removeListener('data', wsHeadHandler);
			prepareWsDataHandler();
			if (buffer.length > 0) {
				if (isMask) {
					socket.on('data', wsDataWithMaskHandler);
					wsDataWithMaskHandler(buffer, true);
				} else {
					socket.on('data', wsDataHandler);
					wsDataHandler(buffer);
				}
			}
		}
	};

	var prepareWsDataHandler = function () {
		console.info('prepareWsDataHandler');
		message = new Buffer(messageLength);
		maxOffset = messageLength - 4;
		end = new Buffer(0);
		offset =  0;
	};

	var wsDataWithMaskHandler = function (data) {
		console.log('wsDataWithMaskHandler, length: ', data, data.length, message.length, arguments[1]);
		//return;
		var i=0;
		var current = Buffer.concat([end, data]);
		current = current.slice(0, messageLength-offset);
		var nextData = end.slice(messageLength-offset);
		var currentLength = Math.floor(current.length / 4) * 4;
		end = current.slice(currentLength);
		current = current.slice(0, currentLength);
		console.log(offset, currentLength, end);
		while (offset <= maxOffset) {
			message.writeInt32BE(mask ^ current.readInt32BE(i), offset);
			offset+=4; i+=4;
		}
		var diff = messageLength - offset;
		if (diff < 4) {
			var maskBuffer = new Buffer(4), k=0;
			maskBuffer.writeUInt32BE(mask, 0);
			while (offset < messageLength) {
				message[offset] = maskBuffer[k] ^ data[i];
				offset++; k++; i++;
			}
		}

		if (offset == messageLength) {
			console.log(socket.remoteAddress + ':' + socket.remotePort + ' [*] <-- ['+ message.toString() +']');
			messageHandler(message.toString());
			socket.removeListener('data', wsDataWithMaskHandler);
			prepareWsHeadHandler();
			socket.on('data', wsHeadHandler);
			if (nextData.length > 0) {
				wsHeadHandler(nextData);
			}
		}
	};

	var wsDataWithMaskEndHandler = function (data) {
		console.log('wsDataWithMaskEndHandler, length: ', data.length);
		var maskBuffer = new Buffer(4), k=0;
		maskBuffer.writeUInt32BE(mask, 0);
		while (offset < messageLength) {
			message[offset] = maskBuffer[k] ^ data[k];
			offset++;
			k++;
			i++;
		}
	};

	var wsDataHandler = function (data) {
		console.log('wsDataHandler, length: ', data.length);
		data.copy(message, offset);
		offset =+ data.length;
		if (offset == messageLength) {
			prepareWsHeadHandler();
			socket.on('data', wsHeadHandler);
			socket.removeListener('data', wsDataHandler);
		}
	};

	var messageHandler = function(message) {
		if (isJson(message)) {
			sendAll(message, socket);
		} else {
			var name = 'Ксения';
			if (socket.remoteAddress == '192.168.0.75') {
				name = 'Слава'
			}
			sendAll(name + ': ' + message.toString(), null);
		}
	};

	var isJson = function (str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	};

	socket.on('data', httpUpgradeHandler);

	socket.on('close', function () {
		sendAll(socket.remoteAddress + ':' + socket.remotePort + ' покинул нас');
		delete wsClients[wsClients.indexOf(socket)];
	});

	socket.on('error', function () {

	});

}).listen(8000);

/*setInterval(function () {
	WebSocketServer.getConnections(function (err, count) {
		console.log('WebSocketServer connections: ' + count);
	});
}, 100);*/

//exports.start = start;
