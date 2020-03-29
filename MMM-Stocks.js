"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(message, response) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        var _this = _super.apply(this, params) || this;
        _this.isHttpError = true;
        _this.message = message;
        _this.status = response.status;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, HttpError);
        }
        return _this;
    }
    return HttpError;
}(Error));
var isHttpError = function (error) {
    return !!error.isHttpError;
};
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
                throw new HttpError("HTTP error", res);
            });
        }
    };
};
var getErrorMessage = function (error) {
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
            var lastUpdatedAt = document.createElement("div");
            var lastUpdatedAtDate = this.state.lastFetchedAt
                ? new Date(this.state.lastFetchedAt).toLocaleString()
                : "Unkown";
            var lastUpdatedAtText = document.createTextNode("Updated at: " + lastUpdatedAtDate);
            lastUpdatedAt.appendChild(lastUpdatedAtText);
            wrapper.appendChild(lastUpdatedAt);
            wrapper.appendChild(list_1);
        }
        else if (this.state.stocks.type === "loading") {
            wrapper.innerHTML = "Loading";
        }
        else {
            wrapper.innerHTML = getErrorMessage(this.state.stocks.error);
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
                        data: Object.values(response).map(function (company) { return company.quote; })
                    },
                    lastFetchedAt: Date.now()
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
        var tenMinutes = 600000;
        setInterval(fetchStocks, tenMinutes);
    }
});
