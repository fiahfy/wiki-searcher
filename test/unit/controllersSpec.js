'use strict';

/* jasmine specs for controllers go here */

describe('controllers', function() {

	beforeEach(function(){
		this.addMatchers({
			toEqualData: function(expected) {
				return angular.equals(this.actual, expected);
			}
		});
		chrome = {
			storage: {
				local: {
					get: function(key, callback){
						callback();
					}
				}
			}
		};
		spyOn(chrome.storage.local, 'get');
	});

	it('test1', function() {
			expect(true).toBe(true);
	});

	beforeEach(module('app'));

	describe('OptionsMainCtrl', function(){
		var scope, ctrl, $httpBackend;

		beforeEach(inject(function($rootScope, $controller) {
			scope = $rootScope.$new();
			ctrl = $controller('OptionsMainCtrl', {$scope: scope});
		}));


		it('test2', function() {
			expect(true).toBe(true);
		});
	});
});
