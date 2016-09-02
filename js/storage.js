var Storage = function() {
	var saveData = JSON.parse(localStorage.saveData || null) || {};
	this.save = function(obj) {
		saveData.obj = obj;
		saveData.time = new Date().getTime();
		localStorage.saveData = JSON.stringify(saveData);
	};
	this.load = function() {
		return saveData.obj || "console.log('lol');";
	};
};