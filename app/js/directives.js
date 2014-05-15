'use strict';

/* Directives */

var directives = angular.module('directives', []);

directives.directive('loading', function(){
	return function(scope, element, attrs) {
		scope.$watch(
			function(){
				return scope.$eval(attrs.loading);
			},
			function(loading){
				if(loading) {
					element.button('loading');
				} else {
					element.button('reset');
				}
			}
		);
	};
});
