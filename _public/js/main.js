var ws, i;

$(function () {

	for(i=0; i<1; i++) {
		ws = new WebSocket('ws://192.168.0.75:8000');
		ws.onopen = function(event) {
			//console.log('onopen');
		};

		ws.onmessage = function(event) {
			if (!isJson(event.data)) {
				//console.log('onmessage, ' + event.data);
				$('.chat > .history').append('<div class=item>' + event.data + '</div>');
			} else {
				onMessage(JSON.parse(event.data));
			}
		};

		ws.onclose = function(event) {
			//console.log('onclose');
		};
	}

	$('.chat > .message > button').click(function(){
		sendMyMessage();
	});

	$('.chat > .message > textarea').keypress(function(e){
		if (e.which == 13) {
			sendMyMessage();
			e.preventDefault();
		}
	});

	function sendMyMessage() {
		ws.send($('.chat > .message > textarea').val());
		$('.chat > .message > textarea').val('');
	}

	navigator.getUserMedia(
		{ audio: false, video: true },
		gotStream,
		function(error) {
			//console.log(error)
		}
	);
});

var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.RTCSessionDescription;
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
var pc; // PeerConnection

function gotStream(stream) {
	document.getElementById("local").src = URL.createObjectURL(stream);
	pc = new PeerConnection(null);
	pc.addStream(stream);
	pc.onicecandidate = gotIceCandidate;
	pc.onaddstream = gotRemoteStream;
}

// Step 2. createOffer
function createOffer() {
	pc.createOffer(
		gotLocalDescription,
		function(error) {
			//console.log(error)
		},
		{ 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } }
	);
}

// Step 3. createAnswer
function createAnswer() {
	pc.createAnswer(
		gotLocalDescription,
		function(error) {
			//console.log(error)
		},
		{
			'mandatory': {
				'OfferToReceiveAudio': true,
				'OfferToReceiveVideo': true
			}
		}
	);
}


function gotLocalDescription (description) {
	pc.setLocalDescription(description);
	sendMessage(description);
}

function gotIceCandidate (event) {
	if (event.candidate) {
		sendMessage({
			type: 'candidate',
			label: event.candidate.sdpMLineIndex,
			id: event.candidate.sdpMid,
			candidate: event.candidate.candidate
		});
	}
}

function gotRemoteStream(event) {
	document.getElementById("remote").src = URL.createObjectURL(event.stream);
}


function sendMessage(message) {
	//console.log(message);
	ws.send(JSON.stringify(message));
}

var onMessage = function(message) {
	//console.log(message);
	if (message.type === 'offer') {
		pc.setRemoteDescription(new SessionDescription(message));
		createAnswer();
	}
	else if (message.type === 'answer') {
		pc.setRemoteDescription(new SessionDescription(message));
	}
	else if (message.type === 'candidate') {
		var candidate = new IceCandidate({sdpMLineIndex: message.label, candidate: message.candidate});
		pc.addIceCandidate(candidate);
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

