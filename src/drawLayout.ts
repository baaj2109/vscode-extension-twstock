import * as vscode from "vscode";
import { IndividualSecurities } from "./utils/stockFormat";
import StrProcess from "./utils/strProcess";

export class Stock extends vscode.TreeItem {
    list: IndividualSecurities;

    updateTitle(title: string) {
        const currentDate = new Date();
        const hour = currentDate.getHours();
        const minute = currentDate.getMinutes();
        const second = currentDate.getSeconds();
        this.label = title + " " + hour + ":" + minute + ":" + second;
    }

    constructor(info: IndividualSecurities) {
        super(
            // use template literals
            // `${info.upDownSymbol} ${StrProcess.strFormatting(
            `${StrProcess.strFormatting(
                info.name,
                5,
                true //full width
            )} ${StrProcess.strFormatting(info.userDefinedDisplay, 10)} ${info.now}`,
            vscode.TreeItemCollapsibleState.None
        );
        this.list = info;

        const mdDetails = new vscode.MarkdownString();
        // ${StrProcess.strFormatting("公司", 6, true)}      ${info.name}
        // ${StrProcess.strFormatting("代號", 6, true)}      ${info.ticker}
        mdDetails.appendMarkdown(`
        ${StrProcess.strFormatting("漲停價", 6, true)}     ${info.highStop}
        ${StrProcess.strFormatting("跌停價", 6, true)}     ${info.lowStop}
        ${StrProcess.strFormatting("累積成交量", 6, true)}  ${info.totalVolume}
        -----------------------------------------------------------------
        ${StrProcess.strFormatting("幅度", 6, true)}       ${info.changeRate}
        ${StrProcess.strFormatting("漲跌", 6, true)}       ${info.changeAmount}
        ${StrProcess.strFormatting("開盤", 6, true)}       ${info.todayOpen}
        ${StrProcess.strFormatting("昨收", 6, true)}       ${info.lastClose}
        -----------------------------------------------------------------
        ${StrProcess.strFormatting("最高", 6, true)}       ${info.high}
        ${StrProcess.strFormatting("最低", 6, true)}       ${info.low}
        -----------------------------------------------------------------`);
        mdDetails.appendCodeblock(
            `    買量    |   買價   ||    賣價   |  賣量`,
            "javascript"
        );

        for (let i = 0; i < info.fiveBuyAmount.length; i++) {
            mdDetails.appendCodeblock(
                `    ${StrProcess.strFormatting(info.fiveBuyAmount[i].toString(), 6
                )} | ${StrProcess.strFormatting(info.fiveBuy[i].toString(), 8
                )} || ${StrProcess.strFormatting(info.fiveSell[i].toString(), 8
                )} |  ${StrProcess.strFormatting(info.fiveSellAmount[i].toString(), 6
                )}`,
                "javascript"
            );
        }
        this.tooltip = mdDetails;

    }
}
