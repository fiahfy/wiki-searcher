'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function() {

	beforeEach(function(){
		this.addMatchers({
			toEqualData: function(expected) {
				return angular.equals(this.actual, expected);
			}
		});

		var dummyStorage = {};
		var dummyListener = null;
		chrome = {
			runtime: {
				onMessage: {
					addListener: function(){}
				}
			},
			storage: {
				local: {
					get: function(){},
					set: function(){}
				}
			}
		};
		spyOn(chrome.runtime.onMessage, 'addListener').andCallFake(function(callback){
			dummyListener = callback;
		});
		spyOn(chrome.storage.local, 'get').andCallFake(function(key, callback){
			callback(dummyStorage);
		});
		spyOn(chrome.storage.local, 'set').andCallFake(function(data, callback){
			dummyStorage = data;
			callback();
		});
	});

	beforeEach(module('app'));

	describe('BackgroundMainCtrl', function(){
		var scope, ctrl, $httpBackend;

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			ctrl = $controller('BackgroundMainCtrl', {$scope: scope});
		}));

		it('test', function() {
			//
		});
	});

	describe('OptionsMainCtrl', function(){
		var scope, ctrl, $httpBackend;

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			ctrl = $controller('OptionsMainCtrl', {$scope: scope});
		}));

		it('test', function() {
			//
		});
	});
});
