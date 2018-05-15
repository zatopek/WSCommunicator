(function () {
	var InteractFlow = function () {
		var _logic = {
			"3fb2831def5f-b022d34d47543cb1-f3e7": {
				"Product Menu": function () {
					wsCommunicator.sendDataToInteraction('3fb2831def5f-b022d34d47543cb1-f3e7', {eventname: 'click', payload: '[data-refname=choices] button:contains(Mobiel)'});
				}
			}
		};
		return {
			process: function (data) {
				if(_logic && _logic[data.interactionId] && _logic[data.interactionId][data.page])
					_logic[data.interactionId][data.page].apply();
			}
		};
	};
	var interactFlow = new InteractFlow();
	wsCommunicator.register('sharebacknextload', this, interactFlow.process);
})();