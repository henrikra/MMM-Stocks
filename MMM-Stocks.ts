Module.register<{ text: string }>("MMM-Stocks", {
	defaults: {
		text: "Sofia!"
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.innerHTML = this.config.text;
		return wrapper;
	}
});
