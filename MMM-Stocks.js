"use strict";
var createIEXApi = function (apiKey) {
    return {
        quoteBatch: function (stocks) {
            var searchParams = new URLSearchParams();
            searchParams.append("symbols", stocks.join(","));
            searchParams.append("types", "quote");
            searchParams.append("token", apiKey);
            return fetch("https://cloud.iexapis.com/stable/stock/market/batch?" + searchParams.toString()).then(function (res) {
                if (res.ok) {
                    return res.json();
                }
                throw new Error("HTTP error");
            });
        }
    };
};
Module.register("MMM-Stocks", {
    getStyles: function () {
        return [this.file("styles.css")];
    },
    getDom: function () {
        var wrapper = document.createElement("div");
        if (this.state.stocks.type === "success") {
            var list_1 = document.createElement("ul");
            this.state.stocks.data.forEach(function (stock) {
                var listItem = document.createElement("li");
                var companyInfo = document.createElement("div");
                var stockSymbol = document.createElement("div");
                var symbolText = document.createTextNode(stock.symbol);
                stockSymbol.appendChild(symbolText);
                stockSymbol.classList.add("small", "bright");
                var companyName = document.createElement("div");
                var companyNameText = document.createTextNode(stock.companyName);
                companyName.appendChild(companyNameText);
                companyName.classList.add("small");
                companyInfo.appendChild(stockSymbol);
                companyInfo.appendChild(companyName);
                listItem.appendChild(companyInfo);
                var numbers = document.createElement("div");
                var currentPrice = document.createElement("div");
                var currentPriceText = document.createTextNode(stock.latestPrice.toString());
                currentPrice.appendChild(currentPriceText);
                currentPrice.classList.add("small", "align-right");
                var priceChange = document.createElement("div");
                var priceChangeText = document.createTextNode(stock.changePercent.toLocaleString("en", {
                    style: "percent",
                    minimumFractionDigits: 2
                }));
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
                list_1.appendChild(listItem);
            });
            wrapper.appendChild(list_1);
        }
        else if (this.state.stocks.type === "loading") {
            wrapper.innerHTML = "Loading";
        }
        else {
            wrapper.innerHTML = "Error";
        }
        return wrapper;
    },
    start: function () {
        var _this = this;
        this.state = { stocks: { type: "loading" } };
        this.IEXApi = createIEXApi(this.config.apiKey);
        var fetchStocks = function () {
            _this.IEXApi.quoteBatch(_this.config.stocks)
                .then(function (response) {
                _this.state = {
                    stocks: {
                        type: "success",
                        data: Object.values(response).map(function (lol) { return lol.quote; })
                    }
                };
                _this.updateDom();
            })
                .catch(function (error) {
                _this.state = { stocks: { type: "error", error: error } };
                _this.updateDom();
                console.log("error", error);
            });
        };
        fetchStocks();
        var fiveMinutes = 300000;
        setInterval(fetchStocks, fiveMinutes);
    }
});
