initExtensions("WSCommunicator", function (app) {
	$(window).off('beforeunload');

	if (!app.WSCommunicator) {
		app.WSCommunicator = (function (){
			if (!Number.parseInt)
				Number.parseInt = parseInt;
			var eventHandlers = {};
			window.addEventListener('message', function (event) {
				try {
					var data = JSON.parse(event.data);
					data.eventname = data.eventname ? data.eventname : data.eventName;
					console.trace('WSCommunicator: JAS: Received Message:' + JSON.stringify(event.data));
					if (eventHandlers[data.eventname]) {
						for (var handler in eventHandlers[data.eventname]) {
							try {
								if (eventHandlers[data.eventname][handler].fn && typeof eventHandlers[data.eventname][handler].fn == 'function') {
									eventHandlers[data.eventname][handler].fn.call(eventHandlers[data.eventname][handler].scope, data.payload);
								}
							} catch (e) {
								console.error('WSCommunicator: JAS: Failed to call handler');
							}
						}
					}
				} catch (e) {
				}

			});

			if (!eventHandlers['setText'])
				eventHandlers['setText'] = [];

			eventHandlers['setText'].push({
				fn: function (selector, value) {
					$(selector).text(value);
				},
				scope: app
			});
			if (!eventHandlers['getText'])
				eventHandlers['getText'] = [];

			eventHandlers['getText'].push({
				fn: function (selector) {
					$(selector).text();
				},
				scope: app
			});

			if (!eventHandlers['getText'])
				eventHandlers['getText'] = [];

			eventHandlers['getText'].push({
				fn: function (selector) {
					window.top.postMessage(JSON.stringify({ 
						"eventName": "getText", 
						"interactionId": app.options.autostart.interactionId,
						 "value": $(selector).text()
						}), '*');
				},
				scope: app
			});

			if (!eventHandlers['show'])
				eventHandlers['show'] = [];

			eventHandlers['show'].push({
				fn: function (selector) {
					$(selector).show();
				},
				scope: app
			});

			if (!eventHandlers['hide'])
				eventHandlers['hide'] = [];

			eventHandlers['hide'].push({
				fn: function (selector) {
					$(selector).hide();
				},
				scope: app
			});

			if (!eventHandlers['click'])
				eventHandlers['click'] = [];

			eventHandlers['click'].push({
				fn: function (selector) {
					$(selector).click();
				},
				scope: app
			});

			window.top.postMessage(JSON.stringify({
				type: 'object',
				register: true,
				interactionId: app.options.autostart.interactionId
			}), '*');
			var internal = {
				sharebacknext: function (command, thatPage) {
					/**
					<div class="commands" style="display:none;">
					<div class="command" key="sharebacknext" onrender="true" target="parent"></div>
					</div>
					 */
					if(this.sharebacknextRegisterd)
						return;
					this.sharebacknextRegisterd = true;
					app.registerExtension('pageRenderer', function (ctx, page) {
						// Place your extension code here
						var name = page.find(".jaa-page-header-text").text();
						window.top.postMessage(JSON.stringify({ "eventName": "sharebacknextload", "page": name, "interactionId": app.options.autostart.interactionId }), '*');
						return page;
					});

					var name = thatPage.find(".jaa-page-header-text").text();
					window.top.postMessage(JSON.stringify({ "eventName": "sharebacknextload", "page": name, "interactionId": app.options.autostart.interactionId }), '*');
				},

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
						window.top.postMessage(JSON.stringify(data), '*');
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
