import * as vscode from "vscode";
import * as https from "https";
import { StockFormat } from "../utils/stockFormat";
import { Stock } from "../drawLayout";
import { IndividualSecurities } from "../utils/stockFormat";

const twseHttpRequest = async (url: string): Promise<any> => {
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
                } else {
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

export function twseApi(stockConfig: StockFormat): Promise<Array<Stock>> {
    const twseUrlPrefix =
        "https://mis.twse.com.tw/stock/api/getStockInfo.jsp?json=1&delay=0&lang=zh_tw&ex_ch=";
    const searchTickerUrl = twseUrlPrefix + Object.keys(stockConfig).join("|");
    // console.log(Object.keys(stockConfig).join("|"));
    return new Promise(async (resolve) => {
        // console.log("before http request, searchTickerUrl: " + searchTickerUrl);
        const twseRetData = await twseHttpRequest(searchTickerUrl);
        // console.log("after http request");

        const resultArr: Array<Stock> = [];
        const upDownSymbolConfig: string[] = ["🔴", "🟡", "🟢"];
        for (
            let tickerNum = 0;
            tickerNum < twseRetData.msgArray.length;
            tickerNum++
        ) {
            let resultStock: IndividualSecurities;
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
                const {
                    lastClose,
                    searchTicker,
                    fiveBuy,
                    fiveBuyAmount,
                    fiveSell,
                    fiveSellAmount,
                } = resultStock;

                // Get five buy/sell
                if (jsonDataPrefix.b) {

                    for (let i = 0; i < jsonDataPrefix.b.split("_").length - 1; i++) {
                        fiveBuy.push(+jsonDataPrefix.b.split("_")[i]);
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

                resultArr.push(new Stock(resultStock));
            }
        }
        resolve(resultArr);
    });
}
