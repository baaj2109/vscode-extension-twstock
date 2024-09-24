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
const strProcess_1 = __importDefault(require("./utils/strProcess"));
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
            fs.writeFileSync(dataFilePath, JSON.stringify(this.items.map((item) => item.list), null, 2), 'utf-8');
            // vscode.window.showInformationMessage('Tree data saved to .vscode/myTreeData.json');
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
                const rawDatas = JSON.parse(data);
                for (const item of rawDatas) {
                    if (isValidIndividualSecurities(item)) {
                        const individualSecurities = item;
                        var s = new drawLayout_1.Stock(individualSecurities);
                        if (!s.list.now) {
                            s.list.now = s.list.lastClose;
                            s.list.changeAmount = 0;
                            s.list.changeRate = "0.00%";
                            s.list.userDefinedDisplay = s.list.changeRate;
                        }
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
    async fetchConfig(stock) {
        const result = await (0, twseApi_1.twseApi)(stock);
        return result;
    }
    async updateStock() {
        // if current time after 13:30 skip
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (hour >= 13 && minute >= 30) {
            return;
        }
        const refreshItems = [];
        for (const item of this.items) {
            const ticker = item.list.ticker;
            const newStock = {};
            let tempStock = ticker.trim();
            let tempStockTse = "";
            let tempStockOtc = "";
            if (ticker !== "") {
                tempStockTse = "tse_" + tempStock + ".tw";
                tempStockOtc = "otc_" + tempStock + ".tw";
                newStock[tempStockTse] = [];
                newStock[tempStockOtc] = [];
            }
            const stocks = await this.fetchConfig(newStock);
            for (const stock of stocks) {
                if (stock) {
                    // refreshItems.push(stock);
                    item.list.fiveBuy = stock.list.fiveBuy;
                    item.list.fiveSell = stock.list.fiveSell;
                    item.list.fiveBuyAmount = stock.list.fiveBuyAmount;
                    item.list.fiveSellAmount = stock.list.fiveSellAmount;
                    item.list.high = stock.list.high;
                    item.list.low = stock.list.low;
                    item.list.highStop = stock.list.highStop;
                    item.list.lowStop = stock.list.lowStop;
                    if (stock.list.now) {
                        item.list.now = stock.list.now;
                        // Here we calculate changeAmount
                        item.list.changeAmount = parseFloat((item.list.now - item.list.lastClose).toFixed(2));
                        // // Here we calculate changeRate
                        item.list.changeRate =
                            (item.list.now - item.list.lastClose < 0 ? "-" : " ") +
                                ((Math.abs(item.list.now - item.list.lastClose) / item.list.lastClose) * 100)
                                    .toFixed(2)
                                    .toString() +
                                "%";
                        item.list.userDefinedDisplay = item.list.changeRate;
                        item.label = `${strProcess_1.default.strFormatting(item.list.name, 5, true //full width
                        )} ${strProcess_1.default.strFormatting(item.list.userDefinedDisplay, 10)} ${item.list.now}`;
                    }
                }
            }
        }
        // this.items = refreshItems;
        this.refresh();
        this.saveDataToWorkspace();
    }
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
        });
    }
}
exports.StockProvider = StockProvider;
//# sourceMappingURL=configSettings.js.map