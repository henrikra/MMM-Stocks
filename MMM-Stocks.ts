type Quote = {
	companyName: string;
	symbol: string;
	changePercent: number;
	latestPrice: number;
};

class HttpError extends Error {
	isHttpError = true;
	status: number;

	constructor(message: string, response: Response, ...params: any[]) {
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		super(...params);

		this.message = message;
		this.status = response.status;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, HttpError);
		}
	}
}

const isHttpError = (error: Error): error is HttpError => {
	return !!(error as HttpError).isHttpError;
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
			).then(res => {
				if (res.ok) {
					return res.json();
				}

				throw new HttpError("HTTP error", res);
			});
		}
	};
};

type Config = { apiKey: string; stocks: string[] };

type RequestLoading = { type: "loading" };
type RequestSuccess<T> = { type: "success"; data: T };
type RequestError = { type: "error"; error: Error };

type Service<T> = RequestLoading | RequestSuccess<T> | RequestError;

const getErrorMessage = (error: Error) => {
	if (isHttpError(error)) {
		switch (error.status) {
			case 402:
				return "Free account request limit exceeded";
			default:
				return "Unknown error";
		}
	}

	return "Unknown error";
};

const isMarketOpen = () => {
	const now = new Date();

	const day = now.getDay();
	const hour = now.getHours();

	return day > 0 && day < 6 && hour > 14 && hour < 22;
};

Module.register<
	Config,
	{
		IEXApi: ReturnType<typeof createIEXApi>;
		state: { stocks: Service<Quote[]>; lastFetchedAt?: number };
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

			const lastUpdatedAt = document.createElement("div");
			const lastUpdatedAtDate = this.state.lastFetchedAt
				? new Date(this.state.lastFetchedAt).toLocaleString()
				: "Unkown";
			const lastUpdatedAtText = document.createTextNode(
				`Updated at: ${lastUpdatedAtDate}`
			);
			lastUpdatedAt.appendChild(lastUpdatedAtText);
			wrapper.appendChild(lastUpdatedAt);

			wrapper.appendChild(list);
		} else if (this.state.stocks.type === "loading") {
			wrapper.innerHTML = "Loading";
		} else {
			wrapper.innerHTML = getErrorMessage(this.state.stocks.error);
		}

		return wrapper;
	},

	start: function() {
		this.state = { stocks: { type: "loading" } };

		this.IEXApi = createIEXApi(this.config.apiKey);

		const fetchStocks = () => {
			if (isMarketOpen()) {
				this.IEXApi.quoteBatch(this.config.stocks)
					.then(response => {
						this.state = {
							stocks: {
								type: "success",
								data: Object.values(response).map(company => company.quote)
							},
							lastFetchedAt: Date.now()
						};
						this.updateDom();
					})
					.catch(error => {
						this.state = { stocks: { type: "error", error } };
						this.updateDom();
						console.log("error", error);
					});
			}
		};

		fetchStocks();

		const tenMinutes = 600_000;

		setInterval(fetchStocks, tenMinutes);
	}
});
