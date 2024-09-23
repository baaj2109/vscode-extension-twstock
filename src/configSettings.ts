import * as vscode from "vscode";
import { Stock } from "./drawLayout";
import { twseApi } from "./apis/twseApi";
import { StockFormat, IndividualSecurities } from "./utils/stockFormat";
import ListCheck from "./utils/listCheck";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


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
            fs.writeFileSync(dataFilePath, JSON.stringify(this.items, null, 2), 'utf-8');
            vscode.window.showInformationMessage('Tree data saved to .vscode/myTreeData.json');
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
                this.items.push(JSON.parse(data) as Stock);
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

    async fetchConfig(stock: { [key: string]: Array<string> }) {
        const result = await twseApi(stock);
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
