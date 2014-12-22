var _di = {},
	_initializers = {};

exports.get = function(name) {
	if (! _di.hasOwnProperty(name)) {
		if (! _initializers.hasOwnProperty(name)) {
			throw 'DI::error -> no initializer "'+ name +'"';
		} else {
			_di[name] = (typeof _initializers[name] == 'function')
				? _initializers[name]() : _initializers[name];
		}
	}
	return _di[name];
};

exports.set = function (name, func) {
	if (typeof func == 'function') {
		_initializers[name] = func;
		_di[name] = func();
	} else {
		_di[name] = func;

	}
	exports[name] = _di[name];
	return this;
};

exports.db = {};
exports.route = {};
exports.autoLoad = {};
exports.usersService = {};
exports.reactor = {};
exports.templates = {};