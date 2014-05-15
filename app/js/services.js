'use strict';

/* Services */

var services = angular.module('services', []);

services.service('WikiService', ['$http', function($http) {
	/**
	 * Private Variables
	 */
	var wikiInfo = {
		pukiwiki: {
			type: 'PukiWiki',
			match: function(url, html){
				if (!html.match(/\/\/pukiwiki\.sourceforge\.jp\//i) &&
				    !html.match(/\/\/wikiwiki\.jp\//i)) {
				    return false;
				}
				return true;
			},
			get: function(url, html){
				var wiki = {};
				wiki.url = url.slice(0, url.lastIndexOf('/')+1);
				$(html).find('a').each(function(){
					var href = $(this).attr('href');
					if (!href) { return; }
					var match = href.match(/cmd=search/i);
					if (match) {
						var action = $(this).attr('href');
						if (action.indexOf('.') === 0) { action = action.replace(/^\.\//, wiki.url); }
						wiki.search = ['javascript', ':', fakePostCode()+';', 'fakePost("'+action+'", "##query##");'].join('');
						return false;
					}
				});
				if (wiki.search) { return wiki; }

				return false;
			}
		},
		mediawiki: {
			type: 'MediaWiki',
			match: function(url, html){
				if (!html.match(/\/\/www\.mediawiki\.org\//i)) { return false; }
				if (!$(html).find('form#searchform').size()) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];
				var action = $(html).find('form#searchform').attr('action');
				if (!action) { return null; }

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/';
				wiki.search = scheme+'//'+domain+action+'?search=##query##';
				$(html).find('form#searchform').find('input[type=hidden]').each(function(){
					var name = $(this).attr('name');
					var value = $(this).val();
					if (name === 'search') { return; }
					wiki.search += '&' + name + '=' + value;
				});
				return wiki;
			}
		},
		dokuwiki: {
			type: 'DokuWiki',
			match: function(url, html){
				if (!html.match(/\/\/wiki\.splitbrain\.org\/wiki:dokuwiki/i)) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/';
				wiki.search = wiki.url+'?do=search&id=##query##';
				return wiki;
			}
		},
		atwiki: {
			type: '@wiki',
			match: function(url, html){
				if (!html.match(/\/\/atwiki\.jp\/policy\.html/i)) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];
				var path = url.split('/')[3];

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/'+path+'/';
				wiki.search = wiki.url+'?cmd=search&keyword=##query##';
				return wiki;
			}
		},
		fc2wiki: {
			type: 'FC2WIKI',
			match: function(url, html){
				if (!html.match(/\/\/wiki\.fc2\.com\//i)) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/';
				wiki.search = wiki.url+'?cmd=search&q=##query##';
				return wiki;
			}
		},
		readmine: {
			type: 'Readmine',
			match: function(url, html){
				if (!html.match(/\/\/www\.redmine\.org\//i)) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];
				var href = $(html).find('#top-menu .home').attr('href');

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/';
				if (href) {
					wiki.url = wiki.url.replace(/\/$/, href);
				}
				wiki.search = wiki.url+'search?q=##query##';
				return wiki;
			}
		},
		confluence: {
			type: 'Confluence',
			match: function(url, html){
				if (!html.match(/\/\/www\.atlassian\.com\/software\/confluence/i)) { return false; }
				return true;
			},
			get: function(url, html){
				var scheme = url.split('/')[0];
				var domain = url.split('/')[2];
				var href = $(html).find('#logo > a').attr('href');

				var wiki = {};
				wiki.url = scheme+'//'+domain+'/';
				if (href) {
					wiki.url = wiki.url.replace(/\/$/, href);
				}
				wiki.search = wiki.url+'dosearchsite.action?queryString=##query##';
				return wiki;
			}
		}
	};

	/**
	 * Private Methods
	 */
	function fakePost(url, query) {
		var form = document.createElement('form');
		form.setAttribute('method', 'post');
		form.setAttribute('action', url);
		var params = [
			{name: 'encode_hint', value: 'あ'},
			{name: 'type', value: 'AND'},
			{name: 'word', value: query}
		];
		for (var i in params)
		{
			var param = params[i];
			var hidden = document.createElement('input');
			hidden.setAttribute('type', 'hidden');
			hidden.setAttribute('name', param.name);
			hidden.setAttribute('value', param.value);
			form.appendChild(hidden);
		}
		document.body.appendChild(form);
		form.submit();
	}
	function fakePostCode() {
		return fakePost.toString().replace(/(\n|\t)/gm, '');
	}

	/**
	 * Strage Management
	 */
	this.save = function(wikis){
		var me = this;
		chrome.storage.local.set({'wikis': wikis}, function() {
			me.requestRefreshContextMenus();
		});
	};
	this.load = function(callback){
		chrome.storage.local.get('wikis', function(items){
			var wikis = items.wikis || [];
			callback(wikis);
		});
	};
	/**
	 * Wiki Management
	 */
	this.initialize = function(callback){
		var me = this;
		$http.get('../data/default.json').success(function(data){
			me.save(data);
			callback();
		});
	};
	this.setDefault = function(wikis, wiki){
		wikis.some(function(v, i){
			if (v.url === wiki.url) {
				v.default = true;
			} else {
				v.default = false;
			}
		});
		this.save(wikis);
	};
	this.delete = function(wikis, wiki){
		wikis.some(function(v, i){
			if (v.url === wiki.url) {
				wikis.splice(i, 1);
				return true;	// break
			}
		});
		this.save(wikis);
	};
	this.insert = function(wikis, wiki){
		wikis.push(wiki);
		this.save(wikis);
	};
	this.exists = function(wikis, wiki){
		return !wikis.every(function(element, index, array){
			return (element.url !== wiki.url);
		});
	};
	/**
	 * Attach Event Listener
	 */
	this.attachRefreshContextMenusListener = function(){
		var me = this;
		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
			var id = message.id;
			var data = message.data;
			/*if (id == 'search') {
				search(data.wiki, data.query);
				sendResponse();
			} else */if (id === 'refreshContextMenus') {
				me.refreshContextMenus();
			}
		});
	};
	this.attachRecievePageDataListener = function(callback){
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
			if (request.id === 'put') {
				callback(request.data);
			}
		});
	};
	this.requestRefreshContextMenus = function(){
		chrome.extension.sendMessage({
			id: 'refreshContextMenus'
		}, function(response) {});
	};
	this.requestPageData = function(callback){
		chrome.windows.getCurrent(function(window){
			chrome.tabs.query({'windowId': window.id, 'active': true}, function(result){
				chrome.tabs.sendRequest(result[0].id, {
					'id': 'get'
				}, function(response){
					callback(response);
				});
			});
		});
	};
	/**
	 * Context Menu
	 */
	this.refreshContextMenus = function(){
		var me = this;
		// remove all menu
		chrome.contextMenus.removeAll(function(){
			me.load(function(wikis){
				// sort by name
				wikis.sort(function(a, b){
					if (a.name.toLowerCase() > b.name.toLowerCase()) { return 1; }
					if (a.name.toLowerCase() < b.name.toLowerCase()) { return -1; }
					return 0;
				});

				var makeSearchFunc = function(w){
					return function(info, tab){
						me.search(w, info.selectionText);
					};
				};
				var callback = function(){};

				for (var i in wikis)
				{
					var wiki = wikis[i];
					// create menu
					chrome.contextMenus.create({
						title: 'Search on "'+wiki.name+'"',
						contexts: ['selection'],
						onclick: makeSearchFunc(wiki)
					}, callback);
				}
			});
		});
	};

	this.search = function(wiki, query){
		if (!wiki.search || !query) { return; }

		var url = wiki.search.replace('##query##', query);
		if (url) {
			// open tab
			chrome.tabs.create({
				url: url
			}, function(tab){});
		}
	};
	this.getWikiWithUrl = function(wikis, url, expect){
		var me = this;
		var d = $.Deferred();
		$http.get(url).then(
			function(data) {
				data = data.data;
				
				// get wiki
				var wiki = me.getWiki(url, data, expect);
				if (!wiki) {
					d.reject(new Error(
						'"'+url+'" is not available site or unknow wiki type!\r'+
						'Please select wiki type.'
					));
					return;
				}

				// check exists
				var exist = me.exists(wikis, wiki);
				if (exist) {
					d.reject(new Error('"'+url+'" is already registered!'));
					return;
				}
				
				// get title
				$http.get(wiki.url).then(function(data) {
					var match = data.data.match(/<title>([^<>]*)<\/title>/i);
					if (match) {
						wiki.name = match[1].replace(/[\n\r]/g, '').trim();
					}

					d.resolve(wiki);

				}, function(){
					d.reject(new Error('"'+url+'" is not available site!'));
				});

			}, function(){
				d.reject(new Error('"'+url+'" is not found!'));
			}
		);
		return d.promise();
	};
	this.getWiki = function(url, html, expect){
		// remove img tag
		html = html.replace(/<img[^>]*>/g, '');

		for (var i in wikiInfo)
		{
			var info = wikiInfo[i];
			if (expect) {
				if (i !== expect) { continue; }
			} else {
				if (!info.match(url, html)) { continue; }
			}

			var wiki = info.get(url, html);
			if (wiki) {
				wiki.type = info.type;
				return wiki;
			}
		}
		return null;
	};
	this.getWikiTypes = function(){
		var types = [];
		for (var i in wikiInfo)
		{
			var info = wikiInfo[i];
			types.push({value: i, name: info.type});
		}
		return types;
	};
}]);
