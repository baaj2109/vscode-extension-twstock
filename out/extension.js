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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const configSettings_1 = require("./configSettings");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // // Use the console to output diagnostic information (console.log) and errors (console.error)
    // // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "twstock" is now active!');
    // // The command has been defined in the package.json file
    // // Now provide the implementation of the command with registerCommand
    // // The commandId parameter must match the command field in package.json
    // const disposable = vscode.commands.registerCommand('twstock.helloWorld', () => {
    //     // 	// The code you place here will be executed every time your command is executed
    //     // 	// Display a message box to the user
    //     vscode.window.showInformationMessage('Hello World from twstock!');
    // });
    // context.subscriptions.push(disposable);
    const nodeProvider = new configSettings_1.StockProvider(context);
    /**
     * set refreshing rate by user defined
     */
    const config = vscode.workspace.getConfiguration("twstock");
    const refreshingRate = config["refreshingRate"];
    setInterval(() => {
        // console.log("refreshing...");
        nodeProvider.updateStock();
    }, refreshingRate * 1000);
    vscode.window.registerTreeDataProvider("twstock", nodeProvider);
    context.subscriptions.push(vscode.commands.registerCommand("twstock.add", () => {
        nodeProvider.addToList();
    }), vscode.commands.registerCommand("twstock.item.remove", (stock) => {
        nodeProvider.removeFromList(stock);
    })); // subscriptions
    context.subscriptions.pop();
}
// This method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map