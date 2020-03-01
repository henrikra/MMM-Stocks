type Quote = { changePercent: number };

const createIEXApi = function(config: Config) {
	return {
		quote(): Promise<Quote> {
			return fetch(
				"https://cloud.iexapis.com/stable/stock/CCL/quote?token=" +
					config.apiKey
			).then(res => res.json());
		}
	};
};

type Config = { apiKey: string };

Module.register<Config, { IEXApi: ReturnType<typeof createIEXApi> }>(
	"MMM-Stocks",
	{
		getDom: function() {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = "Hellurei";
			return wrapper;
		},

		start: function() {
			this.IEXApi = createIEXApi(this.config);

			this.IEXApi.quote()
				.then(response => {
					console.log("vaihto", response.changePercent);
				})
				.catch(error => {
					console.log("erroriiii", error);
				});
		}
	}
);
