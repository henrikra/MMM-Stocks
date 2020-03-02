type Quote = { changePercent: number };

const createIEXApi = function(apiKey: string) {
	return {
		quoteBatch(stocks: string[]): Promise<Record<string, { quote: Quote }>> {
			const searchParams = new URLSearchParams();
			searchParams.append("symbols", stocks.join(","));
			searchParams.append("types", "quote");
			searchParams.append("token", apiKey);

			return fetch(
				`https://cloud.iexapis.com/stable/stock/market/batch?${searchParams.toString()}`
			).then(res => res.json());
		}
	};
};

type Config = { apiKey: string; stocks: string[] };

Module.register<Config, { IEXApi: ReturnType<typeof createIEXApi> }>(
	"MMM-Stocks",
	{
		getDom: function() {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = "Hellurei";
			return wrapper;
		},

		start: function() {
			this.IEXApi = createIEXApi(this.config.apiKey);

			this.IEXApi.quoteBatch(this.config.stocks)
				.then(response => {
					console.log("result", response);
				})
				.catch(error => {
					console.log("erroriiii", error);
				});
		}
	}
);
