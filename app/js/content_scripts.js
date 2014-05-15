'use strict';

$(function(){
	var data = {
		'url': location.href,
		'html': document.lastChild.outerHTML
	};
	chrome.extension.sendRequest({
		'id': 'put',
		'data': data
	}, function(response){});
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		if (request.id === 'get') {
			sendResponse(data);
		} else if (request.id === 'alert') {
			window.alert(request.data.message);
		}
	});
});
