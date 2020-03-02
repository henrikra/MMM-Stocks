type Quote = {
	companyName: string;
	symbol: string;
	changePercent: number;
	latestPrice: number;
};

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

type RequestLoading = { type: "loading" };
type RequestSuccess<T> = { type: "success"; data: T };
type RequestError = { type: "error"; error: Error };

type Service<T> = RequestLoading | RequestSuccess<T> | RequestError;

Module.register<
	Config,
	{
		IEXApi: ReturnType<typeof createIEXApi>;
		state: { stocks: Service<Quote[]> };
	}
>("MMM-Stocks", {
	getStyles: function() {
		return [this.file("styles.css")];
	},
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.state.stocks.type === "success") {
			const list = document.createElement("ul");

			this.state.stocks.data.forEach(stock => {
				const listItem = document.createElement("li");

				const companyInfo = document.createElement("div");

				const stockSymbol = document.createElement("div");
				const symbolText = document.createTextNode(stock.symbol);
				stockSymbol.appendChild(symbolText);
				stockSymbol.classList.add("small", "bright");

				const companyName = document.createElement("div");
				const companyNameText = document.createTextNode(stock.companyName);
				companyName.appendChild(companyNameText);
				companyName.classList.add("small");

				companyInfo.appendChild(stockSymbol);
				companyInfo.appendChild(companyName);

				listItem.appendChild(companyInfo);

				const numbers = document.createElement("div");

				const currentPrice = document.createElement("div");
				const currentPriceText = document.createTextNode(
					stock.latestPrice.toString()
				);
				currentPrice.appendChild(currentPriceText);
				currentPrice.classList.add("small", "align-right");

				const priceChange = document.createElement("div");
				const priceChangeText = document.createTextNode(
					stock.changePercent.toLocaleString("en", {
						style: "percent",
						minimumFractionDigits: 2
					})
				);
				priceChange.appendChild(priceChangeText);
				priceChange.classList.add("small", "align-right");

				if (stock.changePercent < 0) {
					priceChange.classList.add("red");
				}

				if (stock.changePercent > 0) {
					priceChange.classList.add("green");
				}

				numbers.appendChild(currentPrice);
				numbers.appendChild(priceChange);

				listItem.appendChild(numbers);

				list.appendChild(listItem);
			});

			wrapper.appendChild(list);
		} else if (this.state.stocks.type === "loading") {
			wrapper.innerHTML = "Loading";
		} else {
			wrapper.innerHTML = "Error";
		}

		return wrapper;
	},

	start: function() {
		this.state = { stocks: { type: "loading" } };

		this.IEXApi = createIEXApi(this.config.apiKey);

		this.IEXApi.quoteBatch(this.config.stocks)
			.then(response => {
				this.state = {
					stocks: {
						type: "success",
						data: Object.values(response).map(lol => lol.quote)
					}
				};
				this.updateDom();
			})
			.catch(error => {
				this.state = { stocks: { type: "error", error } };
				this.updateDom();
				console.log("error", error);
			});
	}
});
