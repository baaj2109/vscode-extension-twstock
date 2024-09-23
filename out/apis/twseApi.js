"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twseApi = twseApi;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const drawLayout_1 = require("../drawLayout");
const twseHttpRequest = async (url) => {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (result) => {
            let data = "";
            result.on("data", (chunk) => {
                data = data + chunk.toString();
            });
            result.on("end", () => {
                const body = JSON.parse(data);
                // console.log(body);
                if (body.rtcode === "0000") {
                    resolve(body);
                }
                else {
                    console.log("return code: " + body.rtcode);
                    reject("httpRequest: Get data error");
                }
            });
        });
        request.on("error", (error) => {
            console.log("!!!error!!! from https.get", error);
        });
    });
};
function twseApi(stockConfig) {
    const twseUrlPrefix = "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&lang=zh_tw&ex_ch=";
    const searchTickerUrl = twseUrlPrefix + Object.keys(stockConfig).join("|");
    console.log(Object.keys(stockConfig).join("|"));
    return new Promise(async (resolve) => {
        console.log("before http request");
        const twseRetData = await twseHttpRequest(searchTickerUrl);
        console.log("after http request");
        const resultArr = [];
        const upDownSymbolConfig = ["🔴", "🟡", "🟢"];
        for (let tickerNum = 0; tickerNum < twseRetData.msgArray.length; tickerNum++) {
            let resultStock;
            let jsonDataPrefix = twseRetData.msgArray[tickerNum];
            if (jsonDataPrefix.c.length === 0) {
                continue;
            }
            resultStock = {
                name: jsonDataPrefix.n,
                ticker: jsonDataPrefix.c,
                searchTicker: jsonDataPrefix.ex + "_" + jsonDataPrefix.ch,
                now: +jsonDataPrefix.z,
                todayOpen: jsonDataPrefix.o,
                lastClose: +jsonDataPrefix.y, //The unary plus operator converts its operand to Number type, check https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators
                totalVolume: jsonDataPrefix.v,
                high: jsonDataPrefix.h,
                low: jsonDataPrefix.l,
                highStop: +jsonDataPrefix.u,
                lowStop: +jsonDataPrefix.w,
                changeRate: "",
                fiveBuy: [],
                fiveBuyAmount: [],
                fiveSell: [],
                fiveSellAmount: [],
                userDefinedDisplay: "",
            };
            if (resultStock !== undefined) {
                const { lastClose, searchTicker, fiveBuy, fiveBuyAmount, fiveSell, fiveSellAmount, } = resultStock;
                const config = vscode.workspace.getConfiguration("twstock.watchingList");
                let lastPrice = config[searchTicker];
                if (!lastPrice) {
                    lastPrice = lastClose;
                }
                if (!resultStock.now) {
                    resultStock.now = lastPrice;
                } //若盤中fetch出來為"-"表示fetch當下沒成交，所以keep上一次的值，上一次的值會被存在setting.json內
                // Here we calculate changeAmount
                resultStock.changeAmount = parseFloat((resultStock.now - lastClose).toFixed(2));
                // Here we calculate changeRate
                resultStock.changeRate =
                    (resultStock.now - lastClose < 0 ? "-" : " ") +
                        ((Math.abs(resultStock.now - lastClose) / lastClose) * 100)
                            .toFixed(2)
                            .toString() +
                        "%";
                // Here we given a up/down symbol
                if (resultStock.changeAmount > 0) {
                    //漲
                    // resultStock.upDownSymbol = upDownSymbolConfig[0];
                }
                else if (resultStock.changeAmount < 0) {
                    //跌
                    // resultStock.upDownSymbol = upDownSymbolConfig[2];
                }
                else {
                    //平盤
                    // resultStock.upDownSymbol = upDownSymbolConfig[1];
                }
                // Get five buy/sell
                if (jsonDataPrefix.b) {
                    for (let i = 0; i < jsonDataPrefix.b.split("_").length - 1; i++) {
                        fiveBuy.push(+jsonDataPrefix.b.split("_")[i]);
                        // fiveBuyAmount.push(+jsonDataPrefix.g.split("_")[i]);
                        // fiveSell.push(+jsonDataPrefix.a.split("_")[i]);
                        // fiveSellAmount.push(+jsonDataPrefix.f.split("_")[i]);
                    }
                }
                if (jsonDataPrefix.g) {
                    for (let i = 0; i < jsonDataPrefix.g.split("_").length - 1; i++) {
                        fiveBuyAmount.push(+jsonDataPrefix.g.split("_")[i]);
                    }
                }
                if (jsonDataPrefix.a) {
                    for (let i = 0; i < jsonDataPrefix.a.split("_").length - 1; i++) {
                        fiveSell.push(+jsonDataPrefix.a.split("_")[i]);
                    }
                }
                if (jsonDataPrefix.f) {
                    for (let i = 0; i < jsonDataPrefix.f.split("_").length - 1; i++) {
                        fiveSellAmount.push(+jsonDataPrefix.f.split("_")[i]);
                    }
                }
                //在這邊修改使用者想要顯示在list上漲跌的單位(元 / 百分比);
                const vscConfig = vscode.workspace.getConfiguration("twstock,");
                const userDefineConfig = vscConfig["displayChangeUnitIn"];
                if (userDefineConfig === "元") {
                    resultStock.userDefinedDisplay = resultStock.changeAmount.toString();
                }
                else {
                    resultStock.userDefinedDisplay = resultStock.changeRate;
                }
                resultArr.push(new drawLayout_1.Stock(resultStock));
            }
        }
        resolve(resultArr);
    });
}
//# sourceMappingURL=twseApi.js.map