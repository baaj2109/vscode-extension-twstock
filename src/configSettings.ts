import * as vscode from "vscode";
import { Stock } from "./drawLayout";
import { twseApi } from "./apis/twseApi";
import { StockFormat, IndividualSecurities } from "./utils/stockFormat";
import ListCheck from "./utils/listCheck";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import StrProcess from "./utils/strProcess";

function isValidIndividualSecurities(data: any): data is IndividualSecurities {
    return data && typeof data.name === 'string' && typeof data.ticker === 'string';
}


export class StockProvider implements vscode.TreeDataProvider<Stock> {

    public _onDidChangeTreeData: vscode.EventEmitter<Stock | undefined | void> =
        new vscode.EventEmitter<Stock | undefined | void>();

    readonly onDidChangeTreeData: vscode.Event<Stock | undefined | void> =
        this._onDidChangeTreeData.event;

    private items: Stock[] = [];
    private userVscodePath: string;

    constructor(context: vscode.ExtensionContext) {
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
        } else {
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
                        const individualSecurities: IndividualSecurities = item;
                        var s = new Stock(individualSecurities);
                        if (!s.list.now) {
                            s.list.now = s.list.lastClose;
                            s.list.changeAmount = 0;
                            s.list.changeRate = "0.00%";
                            s.list.userDefinedDisplay = s.list.changeRate;
                        }
                        this.items.push(s);
                    } else {
                        console.error("Invalid data format");
                    }
                }
                this.refresh();
            }
        }
    }


    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Stock): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Stock | undefined): vscode.ProviderResult<Stock[]> {
        if (!element) {
            return this.items; // 回傳根節點
        }
    }


    async fetchConfig(stock: { [key: string]: Array<string> }) {
        const result = await twseApi(stock);

        return result;
    }

    async updateStock() {
        const refreshItems: Stock[] = [];

        for (const item of this.items) {
            const ticker = item.list.ticker;
            const newStock: { [key: string]: Array<string> } = {};
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
                        item.list.changeAmount = parseFloat(
                            (item.list.now - item.list.lastClose).toFixed(2)
                        );

                        // // Here we calculate changeRate
                        item.list.changeRate =
                            (item.list.now - item.list.lastClose < 0 ? "-" : " ") +
                            ((Math.abs(item.list.now - item.list.lastClose) / item.list.lastClose) * 100)
                                .toFixed(2)
                                .toString() +
                            "%";
                        item.list.userDefinedDisplay = item.list.changeRate;
                        item.label = `${StrProcess.strFormatting(
                            item.list.name,
                            5,
                            true //full width
                        )} ${StrProcess.strFormatting(item.list.userDefinedDisplay, 10)} ${item.list.now}`;
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
            prompt:
                '輸入股票代號並使用"半形空白"添加多筆, e.g., 2002 2412, (目前只支援上市/上櫃公司，興櫃尚未支援)',
            placeHolder: "Add Stock to List",
        });
        const reloadWindow: boolean = ListCheck.isEmptyList();

        if (result !== undefined) {
            const codeArray = result.split(/[ ]/);
            const newStock: { [key: string]: Array<string> } = {};
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
            this.refresh()
            this.saveDataToWorkspace();
            // if (reloadWindow === true) {
            // vscode.commands.executeCommand("workbench.action.reloadWindow");
            // }
        }
    }

    async removeFromList(stock: { list: IndividualSecurities }): Promise<any> {
        return new Promise((resolve) => {
            const { list } = stock;

            const s = new Stock(list);
            this.items = this.items.filter(item => item.label != s.label);
            this.refresh();
        });
    }
}
