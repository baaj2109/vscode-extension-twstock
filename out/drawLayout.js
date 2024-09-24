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
exports.Stock = void 0;
const vscode = __importStar(require("vscode"));
const strProcess_1 = __importDefault(require("./utils/strProcess"));
class Stock extends vscode.TreeItem {
    list;
    constructor(info) {
        super(
        // use template literals
        // `${info.upDownSymbol} ${StrProcess.strFormatting(
        `${strProcess_1.default.strFormatting(info.name, 5, true //full width
        )} ${strProcess_1.default.strFormatting(info.userDefinedDisplay, 10)} ${info.now}`, vscode.TreeItemCollapsibleState.None);
        this.list = info;
        const mdDetails = new vscode.MarkdownString();
        mdDetails.appendMarkdown(`
        ${strProcess_1.default.strFormatting("公司", 6, true)}      ${info.name}
        ${strProcess_1.default.strFormatting("代號", 6, true)}      ${info.ticker}
        ${strProcess_1.default.strFormatting("漲停價", 6, true)}     ${info.highStop}
        ${strProcess_1.default.strFormatting("跌停價", 6, true)}     ${info.lowStop}
        ${strProcess_1.default.strFormatting("累積成交量", 6, true)}  ${info.totalVolume}
        -----------------------------------------------------------------
        ${strProcess_1.default.strFormatting("幅度", 6, true)}       ${info.changeRate}
        ${strProcess_1.default.strFormatting("漲跌", 6, true)}       ${info.changeAmount}
        ${strProcess_1.default.strFormatting("開盤", 6, true)}       ${info.todayOpen}
        ${strProcess_1.default.strFormatting("昨收", 6, true)}       ${info.lastClose}
        -----------------------------------------------------------------
        ${strProcess_1.default.strFormatting("最高", 6, true)}       ${info.high}
        ${strProcess_1.default.strFormatting("最低", 6, true)}       ${info.low}
        -----------------------------------------------------------------`);
        mdDetails.appendCodeblock(`買量　  |　  買價　 ||    賣價　 |　賣量`, "javascript");
        for (let i = 0; i < info.fiveBuyAmount.length; i++) {
            mdDetails.appendCodeblock(` ${strProcess_1.default.strFormatting(info.fiveBuyAmount[i].toString(), 6)} | ${strProcess_1.default.strFormatting(info.fiveBuy[i].toString(), 8)} || ${strProcess_1.default.strFormatting(info.fiveSell[i].toString(), 8)} |  ${strProcess_1.default.strFormatting(info.fiveSellAmount[i].toString(), 6)}`, "javascript");
        }
        this.tooltip = mdDetails;
    }
}
exports.Stock = Stock;
//# sourceMappingURL=drawLayout.js.map