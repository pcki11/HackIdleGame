var Element = function(selector, defaultRoot) {
	var errors = {
		unknownSelector: "Unknown selector",
		wrongSelector: "Selector is not a string",
		wrongRoot: "Root element not found"
	};
	var me = this;
	var result = null;
	if(!defaultRoot) {
		defaultRoot = document;
	} else if(defaultRoot.constructor === String) {
		defaultRoot = new Element(defaultRoot).find();
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
		if(!defaultRoot) {
			return null;
		}
		var explode = selector.split("");
		var modifier = explode.splice(0, 1)[0];
		var selectorString = explode.join("");
		if(modifier === "#") {
			result = document.getElementById(selectorString);
		} else if(modifier === ".") {
			result = flatSingleOrArray(defaultRoot.getElementsByClassName(selectorString));
		} else {
			result = flatSingleOrArray(defaultRoot.getElementsByTagName(selector));
		}
		return result;
	};
	this.find = function(){
		var result = null;
		if(selector.constructor === Array) {
			result = [];
			for(var i = 0; i < selector.length; i++) {
				result.push(new Element(selector[i], defaultRoot).find());
			}
			return result;
		}
		return findWithStringSelector();
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