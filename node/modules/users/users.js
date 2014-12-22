exports.action = function (callcack, DI) {
	DI.usersService.getAll(function(err, rows){
		setTimeout(function () {
			var now = new Date();
			callcack(DI.templates.users.main({
				title: 'Список пользователей сгенерирован в: ' + now.getTime(),
				users: rows
			}));
		}, 100);
	});

};

