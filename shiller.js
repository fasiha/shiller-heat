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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_ponyfill_1 = __importDefault(require("fetch-ponyfill"));
var xlsx_1 = __importDefault(require("xlsx"));
var fetch = fetch_ponyfill_1.default().fetch;
var xirr = require('./xirr');
exports.SHILLER_IE_XLS_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
var DATA_SHEETNAME = 'Data';
var HEADER_ROW_A1 = '8';
var HEADER_DATE = 'Date';
var HEADER_P = 'P';
var HEADER_D = 'D';
var HEADER_CPI = 'CPI';
var HEADER_10YR_RATE = 'Rate GS10';
var HEADER_REAL_PRICE = 'Price';
var HEADER_REAL_DIVIDEND = 'Dividend';
function decimalDateToYearMonth(dec) {
    var _a = __read(dec.split('.'), 2), y = _a[0], m = _a[1];
    if (!m || !y || y.length === 0 || m.length === 0) {
        throw new Error('bad date');
    }
    return [parseInt(y), m === '1' ? 10 : parseInt(m)];
}
function parseWorkbook(workbook) {
    if (workbook.SheetNames[2] !== DATA_SHEETNAME) {
        throw new Error('unexpected name of third sheet');
    }
    var data = workbook.Sheets[DATA_SHEETNAME];
    var headerRow = 'ABCEGHI'.split('').map(function (col) { return col + HEADER_ROW_A1; }).map(function (a1) { return data[a1].v; });
    if (headerRow.join(',') !== [
        HEADER_DATE, HEADER_P, HEADER_D, HEADER_CPI, HEADER_10YR_RATE, HEADER_REAL_PRICE, HEADER_REAL_DIVIDEND
    ].join(',')) {
        throw new Error('unexpected header on row ' + HEADER_ROW_A1);
    }
    var arr = [];
    var rownum = parseInt(HEADER_ROW_A1) + 1;
    while (typeof data['C' + rownum] !== 'undefined') {
        var _a = __read(decimalDateToYearMonth(data['A' + rownum].w), 2), year = _a[0], month = _a[1];
        var price = data['B' + rownum].v;
        var div = data['C' + rownum].v;
        var cpi = data['E' + rownum].v;
        var interest10y = data['G' + rownum].v;
        var realPrice = data['H' + rownum].v;
        var realDiv = data['I' + rownum].v;
        arr.push({ year: year, month: month, price: price, div: div, cpi: cpi, interest10y: interest10y, realPrice: realPrice, realDiv: realDiv });
        rownum++;
    }
    return arr;
}
exports.parseWorkbook = parseWorkbook;
function mdToDate(row, day) {
    if (day === void 0) { day = 1; }
    return new Date(Date.UTC(row.year, row.month - 1, day));
}
exports.mdToDate = mdToDate;
/**
 * Each month, invest in the stock market (real price, CPI-adjusted), either $1 or 1 share. Reinvest.
 *
 * The assumption is that each month the dividend is paid at the *end* of each month whereas the price corresponds to
 * the price at the *beginning* of the month, so we reinvest with the beginning of next month's price.
 */
function dollarCostAverageBetween(aoa, buyIdx, sellIdx, monthlyScheme, verbose) {
    if (monthlyScheme === void 0) { monthlyScheme = 'dollar'; }
    if (verbose === void 0) { verbose = false; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    // Invest $1 at the beginning of the month
    var monthlyInvestment = monthlyScheme === 'dollar' ? 1 : aoa[buyIdx].realPrice;
    var transactions = [];
    var sharesOwned = 0;
    for (var n = buyIdx; n < sellIdx; ++n) {
        var monthlyInvestment_1 = monthlyScheme === 'dollar' ? 1 : aoa[n].realPrice;
        // invest at beginning of month
        transactions.push({ amount: -monthlyInvestment_1, when: mdToDate(aoa[n]) });
        sharesOwned += monthlyInvestment_1 / aoa[n].realPrice; // dollars / dollars per share
        // reinvest dividends at the end of each month at price at beginning of next month
        var divPayout = aoa[n].realDiv / 12 * sharesOwned; // dollars = dividend dollars per share * shares owned
        sharesOwned += divPayout / aoa[n + 1].realPrice; // dollars / (dollars per share) = shares
    }
    // Sell at the beginning of the final month
    transactions.push({ amount: aoa[sellIdx].realPrice * sharesOwned, when: mdToDate(aoa[sellIdx]) });
    try {
        return xirr(transactions, { verbose: verbose, maxIterations: 2000 }, 0.05);
    }
    catch (e) {
        console.log(transactions
            .map(function (o, i) { return [o.amount, [o.when.getUTCFullYear(), o.when.getUTCMonth() + 1, o.when.getUTCDate()].join('/'),
            aoa[buyIdx + i].realPrice, aoa[buyIdx + i].realDiv]
            .join('\t'); })
            .join('\n'));
        throw e;
    }
}
exports.dollarCostAverageBetween = dollarCostAverageBetween;
function dollarCostAverageBetweenExcess(data, buyIdx, sellIdx, tenYearToMonthlyDiscount) {
    if (tenYearToMonthlyDiscount === void 0) { tenYearToMonthlyDiscount = 1.0; }
    return dollarCostAverageBetween(data, buyIdx, sellIdx) -
        riskfreeBetween(data, buyIdx, sellIdx, tenYearToMonthlyDiscount);
}
exports.dollarCostAverageBetweenExcess = dollarCostAverageBetweenExcess;
function riskfreeBetween(data, buyIdx, sellIdx, tenYearToMonthlyDiscount) {
    if (tenYearToMonthlyDiscount === void 0) { tenYearToMonthlyDiscount = 1.0; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= data.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    var cash = 0;
    var transactions = [];
    for (var n = buyIdx; n < sellIdx; ++n) {
        // put $1 into savings account
        var monthly = data[sellIdx].cpi / data[n].cpi;
        transactions.push({ amount: -monthly, when: mdToDate(data[n]) });
        cash += monthly;
        // earn interest at end of month
        cash += cash * data[n].interest10y / 100 / 12 * tenYearToMonthlyDiscount;
    }
    transactions.push({ amount: cash, when: mdToDate(data[sellIdx]) });
    return xirr(transactions);
}
exports.riskfreeBetween = riskfreeBetween;
function horizonReturns(aoa, nyears, f) {
    if (nyears === void 0) { nyears = 10; }
    if (f === void 0) { f = undefined; }
    if (typeof f === 'undefined') {
        f = dollarCostAverageBetween;
    }
    var months = nyears * 12;
    var lastStart = aoa.length - months;
    var ret = [];
    for (var start = 0; start < lastStart; ++start) {
        var ror = f(aoa, start, start + months);
        ret.push({ starting: mdToDate(aoa[start]), ending: mdToDate(aoa[start + months]), xirr: ror });
    }
    return ret;
}
exports.horizonReturns = horizonReturns;
function getArrayBuffer(url) {
    if (url === void 0) { url = exports.SHILLER_IE_XLS_URL; }
    return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
        return [2 /*return*/, fetch(url).then(function (x) { return x.arrayBuffer(); })];
    }); });
}
exports.getArrayBuffer = getArrayBuffer;
function arrayBufferToWorkbook(buf) { return xlsx_1.default.read(new Uint8Array(buf), { type: "array" }); }
exports.arrayBufferToWorkbook = arrayBufferToWorkbook;
function getWorkbook(url) {
    if (url === void 0) { url = exports.SHILLER_IE_XLS_URL; }
    return __awaiter(this, void 0, void 0, function () { var _a; return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = arrayBufferToWorkbook;
                return [4 /*yield*/, getArrayBuffer(url)];
            case 1: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
        }
    }); });
}
exports.getWorkbook = getWorkbook;
function dcaCPISkip(aoa, buyIdx, sellIdx, skipIdxs) {
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    var skips = skipIdxs || new Set();
    var cash = 0;
    var transactions = [];
    var sharesOwned = 0;
    for (var n = buyIdx; n < sellIdx; ++n) {
        // how do I spend this month's $1?
        transactions.push({ amount: -1, when: mdToDate(aoa[n]) });
        if (skips.has(n)) {
            cash += 1;
        }
        else {
            sharesOwned += 1 / aoa[n].realPrice;
        }
        // cash earns interest at end of month
        cash += cash * (aoa[n].interest10y / 100 / 12);
        // dividends get paid at end of month: reinvest @ price at beginning of next month
        sharesOwned += (aoa[n].realDiv / 12 * sharesOwned) / aoa[n + 1].realPrice;
    }
    // Sell at the beginning of the final month
    transactions.push({ amount: aoa[sellIdx].realPrice * sharesOwned + cash, when: mdToDate(aoa[sellIdx]) });
    return xirr(transactions, { maxIterations: 2000 }, .05);
}
exports.dcaCPISkip = dcaCPISkip;
if (require.main === module) {
    var readFileSync = require('fs').readFileSync;
    var df = JSON.parse(readFileSync('data/ie_data.xls.json', 'utf8'));
    var slice = df.slice(df.length - 12 * 40);
    var totalXirr = dcaCPISkip(slice, 0, slice.length - 1, new Set());
    var missedOneXirrs = [];
    for (var n = 0; n < slice.length - 2; n++) {
        missedOneXirrs.push(dcaCPISkip(slice, 0, slice.length - 1, new Set([n + 1])));
    }
    console.log({ totalXirr: totalXirr });
    console.log(missedOneXirrs);
}
