'use strict';

/* Controllers */

var controllers = angular.module('controllers', []);

controllers.controller('BackgroundMainCtrl', ['$scope', 'WikiService', function($scope, WikiService) {
	WikiService.load(function(wikis){
		if (!wikis.length) {
			WikiService.initialize(function(){
				WikiService.refreshContextMenus();
			});
		} else {
			WikiService.refreshContextMenus();
		}
	});

	// add listener
	WikiService.attachRefreshContextMenusListener();
}]);

controllers.controller('PopupMainCtrl', ['$scope', 'WikiService', function($scope, WikiService){
	$scope.url = null;
	$scope.status = null;

	WikiService.load(function(wikis){
		$scope.wikis = wikis;
		for (var i in $scope.wikis)
		{
			var wiki = $scope.wikis[i];
			if (wiki.default || parseInt(i)===0) {
				$scope.wiki = wiki;
			}
		}
		$scope.$apply();
	});

	// request to contents script
	WikiService.requestPageData(function(data){
		$scope.registerdCheck(data);
	});

	// add listener
	WikiService.attachRecievePageDataListener(function(data){
		$scope.registerdCheck(data);
	});

	$scope.search = function(){
		WikiService.search($scope.wiki, $scope.query);
	};
	$scope.openOption = function(){
		chrome.tabs.create({
			url: 'html/options.html'
		}, function(tab){});
	};
	$scope.alert = function(msg){
		chrome.windows.getCurrent(function(window){
			chrome.tabs.query({'windowId': window.id, 'active': true}, function(result){
				chrome.tabs.sendRequest(result[0].id, {
					'id': 'alert',
					'data': {'message': msg}
				}, function(response){});
			});
		});
	};
	$scope.registerdCheck = function(response){
		if (!response) { return; }

		$scope.url = response.url;

		var wiki = WikiService.getWiki(response.url, response.html);
		if (wiki) {
			// check exists
			var exist = WikiService.exists($scope.wikis, wiki);
			$scope.status = exist ? 'registered' : 'registerable';
			$scope.$apply();
		}
	};
	$scope.insert = function(){
		if ($scope.loading) { return; }

		$scope.loading = true;

		WikiService.getWikiWithUrl($scope.wikis, $scope.url)
		.done(function(wiki){
			WikiService.insert($scope.wikis, wiki);
			$scope.alert('This site is registered.');
		}).fail(function(err){
			$scope.alert(err.message);
		}).always(function(){
			$scope.loading = false;
		});
	};
}]);

controllers.controller('OptionsMainCtrl', ['$scope', '$window', 'WikiService', function($scope, $window, WikiService){
	$scope.types =[{name: '(Autodetection)'}];
	$scope.types = $scope.types.concat(WikiService.getWikiTypes());
	$scope.type = $scope.types[0];

	WikiService.load(function(wikis){
		$scope.wikis = wikis;
		$scope.$apply();
	});

	$scope.insert = function(){
		if (!$scope.url || $scope.loading) { return; }

		$scope.loading = true;
		
		WikiService.getWikiWithUrl($scope.wikis, $scope.url, $scope.type.value)
		.done(function(wiki){
			WikiService.insert($scope.wikis, wiki);
			$scope.url = '';
		}).fail(function(err){
			$window.alert(err.message);
		}).always(function(){
			$scope.loading = false;
		});
	};
	$scope.delete = function(wiki){
		if (!$window.confirm('Delete "'+wiki.name+'"?')){
			return;
		}

		WikiService.delete($scope.wikis, wiki);
	};
	$scope.setDefault = function(wiki){
		WikiService.setDefault($scope.wikis, wiki);
	};
}]);
