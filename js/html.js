var Cache = function() {
	var cache = {};
	this.get = function(key, missCallback) {
		var item = cache[key];
		if(!item) {
			console.log("cache miss: "+key);
			if(missCallback) {
				item = cache[key] = missCallback(key);
			}
		} else {
			console.log("no cache miss: "+key);
		}
		return item;
	};
};
var cache = new Cache();
var Element = function(selector, defaultRoot) {
	var errors = {
		unknownSelector: "Unknown selector",
		wrongSelector: "Selector is not a string",
		wrongRoot: "Root element not found"
	};
	var me = this;
	var rootEl = null;
	var isElement = function(o) {
		return !!(typeof HTMLElement === "object" ? o instanceof HTMLElement : o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
	};
	if(!defaultRoot || defaultRoot == document) {
		defaultRoot = "document";
		rootEl = document;
	} else if(defaultRoot.constructor === String) {
		rootEl = new Element(defaultRoot).find();
	} else if(isElement(defaultRoot)){
		rootEl = defaultRoot;
	} else {
		throw new Error(errors.wrongRoot);
	}
	var flatSingleOrArray = function(val) {
		if(val.length == 0) {
			return null;
		}
		else if(val.length == 1) {
			return val[0];
		}
		return val;
	};
	var findWithStringSelector = function() {
		if(selector.constructor !== String) {
			throw new Error(errors.wrongSelector);
		}
		if(!rootEl) {
			return null;
		}
		var explode = selector.split("");
		var modifier = explode.splice(0, 1)[0];
		var selectorString = explode.join("");
		var result = null;
		if(modifier === "#") {
			result = document.getElementById(selectorString);
		} else if(modifier === ".") {
			result = flatSingleOrArray(rootEl.getElementsByClassName(selectorString));
		} else {
			result = flatSingleOrArray(rootEl.getElementsByTagName(selector));
		}
		return result;
	};
	this.find = function(){
		var result = null;
		if(selector.constructor === Array) {
			result = [];
			for(var i = 0; i < selector.length; i++) {
				result.push(new Element(selector[i], rootEl).find());
			}
			return result;
		}
		return cache.get(selector+" in "+defaultRoot, function() {
			return findWithStringSelector();	
		})
	};
	if(!selector) {
		throw new Error(errors.unknownSelector);
	}
};
/// get element
var $ = function(selector, elementRoot, __debug) {
	var el = new Element(selector, elementRoot);
	if(__debug) {
		return el;
	}
	return el.find();
};
/// create element
var _ = function(name, callback) {
	var el = document.createElement(name);
	if(callback) {
		callback(el);
	}
	return el;
};