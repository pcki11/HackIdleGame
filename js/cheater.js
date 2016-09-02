var Cheater = function(button, textarea) {
	var storage = new Storage();
	var dangerousEval = function(code) {
		/* dangerous eval */
		(function() {
			eval(code);
		})();
		/* booo */
	};
	button.onclick = function() {
		var code = textarea.value;
		storage.save(code);
		dangerousEval(code);
	};
	this.load = function() {
		textarea.value = storage.load();
	};
};