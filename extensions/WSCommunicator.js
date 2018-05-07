initExtensions("WSCommunicator", function (app) {
	$(window).off('beforeunload');

	if (!app.WSCommunicator) {
		app.WSCommunicator = (function () {
			if (!Number.parseInt)
				Number.parseInt = parseInt;
			var eventHandlers = {};
			window.addEventListener('message', function (event) {
				console.trace('WSCommunicator: JAS: Received Message:' + JSON.stringify(event));
				var data = JSON.parse(event.data);
				if (eventHandlers[data.eventName]) {
					for (var handler in eventHandlers[data.eventName]) {
						try {
							if (eventHandlers[data.eventName][handler].fn && typeof eventHandlers[data.eventName][handler].fn == 'function') {
								eventHandlers[data.eventName][handler].fn.call(eventHandlers[data.eventName][handler].scope, data.name, data.value);
							}
						} catch (e) {
							console.error('WSCommunicator: JAS: Failed to call handler');
						}
					}
				}
			});
			parent.postMessage(JSON.stringify({
					type: 'object',
					register: true
				}), '*');
			var internal = {
				postmessage: function (command, thatPage) {
					/**
					<div class="commands" style="display:none;">
					<div class="command" key="postmessage" onrender="true" msg="Some Message was sent from gointeract" target="parent"></div>
					</div>
					 **/
					var data = {};
					for (var i in command.attributes) {
						if (typeof command.attributes[i] == 'object')
							data[command.attributes[i].nodeName] = command.attributes[i].nodeValue;
					}
					var target = $(command).attr('target');
					if (target == 'parent') {
						console.log('Interact posting message - ' + data);
						parent.postMessage(JSON.stringify(data), '*');
					} else {
						//Find the iframe by id
						document.getElementById(target).contentWindow.postmessage(data, '*');
					}
				},
				syncFieldWithWS: function (command, thatPage) {
					/**
					<span id="syncWSfirstName"></span>
					<div class="commands" style="display:none;">
					<div class="command" key="syncFieldWithWS" onrender="true" fieldname="syncWSfirstName" dataname="firstName"></div>
					</div>
					 **/
					var fieldName = $(command).attr('fieldName');
					var dataName = $(command).attr('dataName');

					if (!eventHandlers['sync'])
						eventHandlers['sync'] = [];

					eventHandlers['sync'].push({
						fn: function (name, value) {
							if (name == fieldName)
								this.find('#' + fieldName).text(value);
						},
						scope: thatPage
					});
				}
			};

			return {
				run: function (command, thatPage, ctx) {
					//look up the key in command and run it.
					try {
						var commandKey = "";
						if ($(command).attr('key')) {
							commandKey = $(command).attr('key');
						} else {
							//must be a js command
							if (command && command.key) {
								commandKey = command.key;

							}
						}
						if (internal[commandKey]) {
							//Command exists
							internal[commandKey].apply(this, [command, thatPage, ctx]);
						} else {
							console.log('Oops invalid command executed');
						}
					} catch (e) {
						console.log('Could not run a command');
						console.log(command);
					}
				}
			};
		})();
	}

	app.registerExtension('pageRenderer', function (ctx, page) {
		// Place your extension code here
		page.find('commands>command[onrender=true]').each(function (i, command) {
			if (app.WSCommunicator)
				app.WSCommunicator.run(command, page, ctx);
		});
		//<div class="commands" style="display:none;"></div>
		page.find('div.commands>div.command[onrender=true]').each(function (i, command) {
			if (app.WSCommunicator)
				app.WSCommunicator.run(command, page, ctx);
		});

		return page;
	});

	app.registerExtension("loaded", function (ctx, page) {

		page.find('commands>command[onload=true]').each(function (i, command) {
			if (app.WSCommunicator)
				app.WSCommunicator.run(command, page, ctx);
		});
		//<div class="commands" style="display:none;"></div>
		page.find('div.commands>div.command[onload=true]').each(function (i, command) {
			if (app.WSCommunicator)
				app.WSCommunicator.run(command, page, ctx);
		});
	});
});
