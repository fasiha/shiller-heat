"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var xlsx_1 = __importDefault(require("xlsx"));
var shiller_1 = require("./shiller");
var yahoo_finance_1 = require("./yahoo-finance");
function horizonToTSV(y) {
    var d = y.starting.toISOString().split('T')[0];
    var x = y.xirr;
    return d + "\t" + x;
}
function minmax(arr) {
    var e_1, _a;
    if (arr.length === 0) {
        throw new Error('minmax does not work on empty arrays');
    }
    var min = arr[0];
    var max = arr[0];
    try {
        for (var arr_1 = __values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
            var x = arr_1_1.value;
            min = Math.min(x, min);
            max = Math.max(x, max);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (arr_1_1 && !arr_1_1.done && (_a = arr_1.return)) _a.call(arr_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return { min: min, max: max };
}
function analyze(aoa) {
    var _a = minmax(aoa.map(function (_a) {
        var price = _a.price, div = _a.div;
        return div / price;
    })), worstDivRate = _a.min, bestDivRate = _a.max;
    var f = function (n) { return (n * 100).toFixed(3); };
    console.log('# Dividends');
    console.log("Worst and best dividend rates: " + f(worstDivRate) + "% and " + f(bestDivRate) + "%");
    var start = 0;
    var end = 12;
    console.log('## Buy once, sell later, keep dividends as cash');
    console.log("XIRR = " + f(shiller_1.lumpBetween(aoa, start, end)) + "%");
    console.log('## Buy once, reinvest dividends, sell later');
    console.log("XIRR = " + f(shiller_1.reinvestBetween(aoa, start, end)) + "%");
    console.log('## Dollar-cost-average (buy a share every month), reinvest dividends, sell later');
    console.log("XIRR = " + f(shiller_1.dollarCostAverageBetween(aoa, start, end)) + "%");
    console.log('## Dollar-cost-average (invest $CPI each month), reinvest dividends, sell later');
    console.log("XIRR = " + f(shiller_1.dollarCostAverageCPIBetween(aoa, start, end)) + "%");
    // console.log(aoa[start], aoa[end])
    console.log('## Ten year horizons');
    shiller_1.horizonReturns(aoa, 10).forEach(function (y) { return console.log(horizonToTSV(y)); });
    console.log('## 30 year horizons');
    shiller_1.horizonReturns(aoa, 30).forEach(function (y) { return console.log(horizonToTSV(y)); });
    console.log('## 50 year horizons');
    shiller_1.horizonReturns(aoa, 50).forEach(function (y) { return console.log(horizonToTSV(y)); });
}
if (module === require.main) {
    var _a = require('fs'), existsSync = _a.existsSync, readFileSync = _a.readFileSync, writeFileSync = _a.writeFileSync;
    var datapath_1 = 'data/';
    var xlsfile_1 = datapath_1 + shiller_1.SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
    var jsonfile_1 = xlsfile_1 + '.json';
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var aoa, workbook, naoa;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    aoa = [];
                    if (!existsSync(jsonfile_1)) return [3 /*break*/, 1];
                    aoa = JSON.parse(readFileSync(jsonfile_1, 'utf8'));
                    return [3 /*break*/, 5];
                case 1:
                    workbook = void 0;
                    if (!existsSync(xlsfile_1)) return [3 /*break*/, 2];
                    workbook = xlsx_1.default.readFile(xlsfile_1);
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, shiller_1.getWorkbook()];
                case 3:
                    workbook = _a.sent();
                    _a.label = 4;
                case 4:
                    aoa = shiller_1.parseWorkbook(workbook);
                    writeFileSync(jsonfile_1, JSON.stringify(aoa));
                    _a.label = 5;
                case 5:
                    analyze(aoa);
                    naoa = yahoo_finance_1.parseRawCSV(readFileSync(datapath_1 + '^N225.csv', 'utf8'));
                    console.log(shiller_1.horizonReturns(naoa, 10, shiller_1.dollarCostAverageBetween));
                    return [2 /*return*/];
            }
        });
    }); })();
}
