$(function(){
	var ws = new WebSocket('ws://localhost:8000');
	ws.onopen = function(event) {
		console.log('onopen');
	};

	ws.onmessage = function(event) {
		console.log('onmessage, ' + event.data);
		$('#output').append(event.data + "<br>\r\n");
	};

	ws.onclose = function(event) {
		console.log('onclose');
	};

	$('#ws button').click(function(){
		ws.send($('#ws textarea').val());
		$('#ws textarea').val('');
	});
});

