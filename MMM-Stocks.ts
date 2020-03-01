type Quote = { changePercent: number };

const createIEXApi = function(apiKey: string) {
	return {
		quoteBatch(stocks: string[]): Promise<Record<string, { quote: Quote }>> {
			return fetch(
				`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${stocks.join(
					","
				)}&types=quote&token=` + apiKey
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
					console.log("result", response.DIS.quote);
				})
				.catch(error => {
					console.log("erroriiii", error);
				});
		}
	}
);
