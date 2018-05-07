var wsCommunicator = null;
(function () {
	var WSCommunicator = function () {

		const eventHandlers = {};
		const windows = [];
		window.addEventListener('message', function (event) {
			console.trace('WSCommunicator: Received Message:' + JSON.stringify(event));
			var data = JSON.parse(event.data);
			//Should this list be pruned when a refresh happens? probably not, the window will be the same but the location will change maybe?
			if (data.register) {
				windows.push(event.source);
			}
			if (eventHandlers[data.eventname]) {
				for (var handler in eventHandlers[data.eventname]) {
					//Call Handler
					try {
						if (eventHandlers[data.eventname][handler].fn && typeof eventHandlers[data.eventname][handler].fn == 'function') {
							eventHandlers[data.eventname][handler].fn.call(eventHandlers[data.eventname][handler].scope, data);
						}
					} catch (e) {
						console.error('Failed to call handler');
					}
				}
			}
		});
		return {
			sendData: function (data) {
				console.trace('WSCommunicator: Sending data: ' + JSON.stringify(data));
				for (var window in windows) {
					windows[window].postMessage(JSON.stringify(data), '*');
				}
			},
			register: function (eventname, scope, callback) {
				console.trace('WSCommunicator: Registering handler for: ' + eventname);
				if (!eventHandlers[eventname])
					eventHandlers[eventname] = [];
				eventHandlers[eventname].push({
					fn: callback,
					scope: scope
				});
			}
		};
	};
	wsCommunicator = new WSCommunicator();
})()
