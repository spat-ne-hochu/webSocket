exports.init = function(DI) {

	DI.set('rootPath', __dirname);

	DI.set('autoLoad', function() {
		return function(name) {
			var arr = name.split(':');
			var moduleName = arr[arr.length - 1];
			var path = DI.get('rootPath') + '/' +  name.replace(/:/g, '/') + '/' + moduleName;
			return require(path);
		}
	});

	DI.set('db', function() {
		return DI.autoLoad('lib:db:mysql');
	});

	DI.set('usersModule', function(){
		return DI.autoLoad('modules:users');
	});

	DI.set('usersService', function(){
		return DI.autoLoad('services:users');
	});

	DI.set('route', function() {

		var _queue = {};

		return function(url, DI, client, callback) {
			var components = url.split('/');
			var moduleName = components[1] + 'Module';

			if (!_queue.hasOwnProperty(moduleName)) {
				_queue[moduleName] = [];
			}

			if (! DI.hasOwnProperty(moduleName)) {
				return '404 Not Found';
			}

			if (typeof DI[moduleName].action == 'function') {
				_queue[moduleName].push(callback);
				if (_queue[moduleName].length == 1) {
					console.log(new Date().toUTCString() + ' \033[32m' + '(*) Train #1 go to ' + '\033[39m{' + moduleName + '}');
					DI[moduleName].action(function (data) {
						var i, length = _queue[moduleName].length;
						console.log(new Date().toUTCString() + ' \033[34m' + '(*) Train #1 return from ' + '\033[39m{' + moduleName + '}');
						for (i=0; i<length; ++i) {
							_queue[moduleName][i](data);
							if (i == 0) {
								console.log(new Date().toUTCString() + ' \033[92m' + '(*) Train #1 approach to client... ' + '\033[39m');
							} else {
								console.log(new Date().toUTCString() + ' \033[96m' + '(*) Train #' + (i+1) + ' approach to client from central ' + '\033[39m');
							}
						}
						_queue[moduleName] = [];
					}, DI);
				} else {
					console.log(new Date().toUTCString() + ' \033[93m\033[5m' + '(*) Train #' + (_queue[moduleName].length) + ' wait in central station... ' + '\033[25m\033[39m');
				}
			}
			else {
				callback('bad module');
			}
		}
	});

	DI.set('reactor', function() {
		return DI.autoLoad('lib:reactor');
	});

    DI.set('templates', function() {
        var fs = require('fs');
        var glob = require('glob');
        var templates = {};
        var htmlFiles = glob.sync('./modules/**/*.template.html'), i;
        //console.log(htmlFiles);
        for (i=0;i<htmlFiles.length;++i) {
            var html = fs.readFileSync(htmlFiles[i]);
            var arr = htmlFiles[i].split('/');
            if (!templates[arr[2]]) templates[arr[2]] = {};
            templates[arr[2]][arr[4]] = DI.reactor.compile(html);
        }
        return templates;
    });
};
