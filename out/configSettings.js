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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockProvider = void 0;
const vscode = __importStar(require("vscode"));
const drawLayout_1 = require("./drawLayout");
const twseApi_1 = require("./apis/twseApi");
const listCheck_1 = __importDefault(require("./utils/listCheck"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
function isValidIndividualSecurities(data) {
    return data && typeof data.name === 'string' && typeof data.ticker === 'string';
}
class StockProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    items = [];
    userVscodePath;
    constructor(context) {
        const packageJsonPath = path.join(context.extensionPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const extensionName = packageJson.name;
        const userHomeDir = os.homedir();
        this.userVscodePath = path.join(userHomeDir, '.vscode', "extensions", extensionName);
        this.loadDataFromWorkspace();
    }
    // 儲存資料到 .vscode/myTreeData.json 檔案
    saveDataToWorkspace() {
        if (this.userVscodePath) {
            const dataFilePath = path.join(this.userVscodePath, 'myTreeData.json');
            // 確保 .vscode 資料夾存在
            if (!fs.existsSync(this.userVscodePath)) {
                fs.mkdirSync(this.userVscodePath);
            }
            // 儲存資料到檔案     
            fs.writeFileSync(dataFilePath, JSON.stringify(this.items, null, 2), 'utf-8');
            vscode.window.showInformationMessage('Tree data saved to .vscode/myTreeData.json');
        }
        else {
            vscode.window.showErrorMessage('Workspace folder is undefined.');
        }
    }
    // 從 .vscode/myTreeData.json 讀取資料
    loadDataFromWorkspace() {
        if (this.userVscodePath) {
            const dataFilePath = path.join(this.userVscodePath, 'myTreeData.json');
            if (fs.existsSync(dataFilePath)) {
                const data = fs.readFileSync(dataFilePath, 'utf-8');
                // this.items.push(JSON.parse(data) as Stock);
                const rawDatas = JSON.parse(data);
                // this.items = rawData.map((item: any) => new Stock(item.label));
                for (const item of rawDatas) {
                    if (isValidIndividualSecurities(item.list)) {
                        const individualSecurities = item.list;
                        var s = new drawLayout_1.Stock(individualSecurities);
                        this.items.push(s);
                    }
                    else {
                        console.error("Invalid data format");
                    }
                }
                this.refresh();
            }
        }
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            return this.items; // 回傳根節點
        }
    }
    // getChildren(): Promise<Array<Stock>> {
    // return this.getWatchingList();
    // }
    // configuring(stocks: object): Promise<any> {
    //     return new Promise((resolve) => {
    //         const config = vscode.workspace.getConfiguration();
    //         const watchingList = Object.assign(
    //             {},
    //             config.get("twstock.watchingList", {}),
    //             stocks
    //         );
    //         config
    //             .update("twstock.watchingList", watchingList, true)
    //             .then(() => {
    //                 resolve("update success on configuring");
    //             });
    //     });
    // }
    async fetchConfig(stock) {
        const result = await (0, twseApi_1.twseApi)(stock);
        // console.log("fetch from twse api success");
        // const insertStockObj: { [key: string]: number } = {};
        // result.forEach((stockInfo) => {
        //     if (stockInfo) {
        //         /**
        //          * 最終settings.json內的格式為 "tse_2412.tw": 123
        //          * stockInfo.list.searchTicker = tse_2412.tw
        //          * stockInfo.list.now = 123
        //          */
        //         // insertStockObj[stockInfo.list.searchTicker] = stockInfo.list.now;
        //     }
        // });
        // await this.configuring(insertStockObj);
        return result;
    }
    // async getWatchingList(): Promise<Array<Stock>> {
    //     const config = vscode.workspace
    //         .getConfiguration()
    //         .get("twstock.watchingList", {});
    //     console.log("before fetch");
    //     const result: Array<Stock> = await this.fetchConfig(config);
    //     console.log("after fetch");
    //     return result;
    // }
    async addToList() {
        const result = await vscode.window.showInputBox({
            value: "",
            prompt: '輸入股票代號並使用"半形空白"添加多筆, e.g., 2002 2412, (目前只支援上市/上櫃公司，興櫃尚未支援)',
            placeHolder: "Add Stock to List",
        });
        const reloadWindow = listCheck_1.default.isEmptyList();
        if (result !== undefined) {
            const codeArray = result.split(/[ ]/);
            const newStock = {};
            for (const stock of codeArray) {
                let tempStock = stock.trim();
                let tempStockTse = "";
                let tempStockOtc = "";
                if (stock !== "") {
                    tempStockTse = "tse_" + tempStock + ".tw";
                    tempStockOtc = "otc_" + tempStock + ".tw";
                    newStock[tempStockTse] = [];
                    newStock[tempStockOtc] = [];
                }
            }
            /**
             * 加入await避免還沒完成加入個股就fire
             */
            const stock = await this.fetchConfig(newStock);
            for (const item of stock) {
                if (item) {
                    this.items.push(item);
                }
            }
            // this._onDidChangeTreeData.fire();
            this.refresh();
            this.saveDataToWorkspace();
            // if (reloadWindow === true) {
            // vscode.commands.executeCommand("workbench.action.reloadWindow");
            // }
        }
    }
    async removeFromList(stock) {
        return new Promise((resolve) => {
            const { list } = stock;
            const s = new drawLayout_1.Stock(list);
            this.items = this.items.filter(item => item.label != s.label);
            this.refresh();
            // const config = vscode.workspace.getConfiguration();
            // var watchingList: StockFormat = Object.assign(
            //     {},
            //     config.get("twstock.watchingList", {})
            // );
            // delete watchingList[list.searchTicker];
            // config
            //     .update("twstock.watchingList", watchingList, true)
            //     .then(() => {
            //         resolve("update success on remove config");
            //         // this._onDidChangeTreeData.fire();
            //         this.refresh
            //         // if (ListCheck.isBecomeEmptyList() === true) {
            //         //     vscode.commands.executeCommand("workbench.action.reloadWindow");
            //         // }
            //     });
        });
    }
}
exports.StockProvider = StockProvider;
//# sourceMappingURL=configSettings.js.map