// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { StockProvider } from "./configSettings";


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
    const nodeProvider = new StockProvider(context);

    /**
     * set refreshing rate by user defined
     */
    const config = vscode.workspace.getConfiguration("twstock");
    const refreshingRate: number = config["refreshingRate"];
    setInterval(() => {
        // console.log("refreshing...");
        nodeProvider.updateStock();
    }, refreshingRate * 1000);

    vscode.window.registerTreeDataProvider("twstock", nodeProvider);

    context.subscriptions.push(
        vscode.commands.registerCommand("twstock.add", () => {
            nodeProvider.addToList();
        }),
        vscode.commands.registerCommand("twstock.item.remove", (stock) => {
            nodeProvider.removeFromList(stock);
        })
    ); // subscriptions
    context.subscriptions.pop(
    )
}

// This method is called when your extension is deactivated
export function deactivate() { }
