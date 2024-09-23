"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StrProcess {
    strFormatting(sourceString, totalLength, fullWidth = false) {
        const sourceStringLength = sourceString.length;
        let dummySpaces = "";
        for (let i = 0; i < totalLength - sourceStringLength; i++) {
            if (fullWidth) {
                dummySpaces += "　"; //全形空白
            }
            else {
                dummySpaces += " ";
            }
        }
        return sourceString + dummySpaces;
    }
}
exports.default = new StrProcess();
//# sourceMappingURL=strProcess.js.map