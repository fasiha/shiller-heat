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
Object.defineProperty(exports, "__esModule", { value: true });
var fetch_ponyfill_1 = __importDefault(require("fetch-ponyfill"));
var xlsx_1 = __importDefault(require("xlsx"));
var fetch = fetch_ponyfill_1.default().fetch;
var xirr = require('xirr');
exports.SHILLER_IE_XLS_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
var DATA_SHEETNAME = 'Data';
var HEADER_ROW_A1 = '8';
var HEADER_DATE = 'Date';
var HEADER_P = 'P';
var HEADER_D = 'D';
var HEADER_CPI = 'CPI';
function decimalDateToYearMonth(dec) {
    var _a = __read(dec.split('.'), 2), y = _a[0], m = _a[1];
    if (!m || !y || y.length === 0 || m.length === 0) {
        throw new Error('bad date');
    }
    return [parseInt(y), m === '1' ? 10 : parseInt(m)];
}
function parse(workbook) {
    if (workbook.SheetNames[2] !== DATA_SHEETNAME) {
        throw new Error('unexpected name of third sheet');
    }
    var data = workbook.Sheets[DATA_SHEETNAME];
    var headerRow = 'ABCE'.split('').map(function (col) { return col + HEADER_ROW_A1; }).map(function (a1) { return data[a1].v; });
    if (headerRow.join(',') !== [HEADER_DATE, HEADER_P, HEADER_D, HEADER_CPI].join(',')) {
        throw new Error('unexpected header on row ' + HEADER_ROW_A1);
    }
    var arr = [];
    var rownum = parseInt(HEADER_ROW_A1) + 1;
    while (typeof data['C' + rownum] !== 'undefined') {
        var _a = __read(decimalDateToYearMonth(data['A' + rownum].w), 2), year = _a[0], month = _a[1];
        var price = data['B' + rownum].v;
        var div = data['C' + rownum].v;
        var cpi = data['E' + rownum].v;
        arr.push({ year: year, month: month, price: price, div: div, cpi: cpi });
        rownum++;
    }
    return arr;
}
exports.parse = parse;
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
function mdToDate(row, day) {
    if (day === void 0) { day = 1; }
    return new Date(Date.UTC(row.year, row.month - 1, day));
}
/**
 * The convention here is that: you buy at the beginning of the month indicated by `aoa[buyIdx]`. You collect
 * dividends at the end of the month. Then eventually you sell at the first of the month of `aoa[sellIdx]`.
 *
 * This is the dumbest investment scheme: buy a share, save the dividends as cash, and sell.
 */
function lumpBetween(aoa, buyIdx, sellIdx, verbose) {
    if (verbose === void 0) { verbose = false; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    // Buy first of month
    var transactions = [{ amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx]) }];
    // Collect dividends every month-end (I assume this is how Shiller data works)
    for (var n = buyIdx; n < sellIdx; ++n) {
        transactions.push({ amount: aoa[n].div, when: mdToDate(aoa[n], 28) });
    }
    // Sell at the beginning of the final month
    transactions.push({ amount: aoa[sellIdx].price, when: mdToDate(aoa[sellIdx]) });
    console.log(transactions);
    return xirr(transactions);
}
exports.lumpBetween = lumpBetween;
function roundCents(n) { return Math.floor(n * 100) / 100; }
function reinvestBetween(aoa, buyIdx, sellIdx, verbose) {
    if (verbose === void 0) { verbose = false; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    // Buy first of month
    var transactions = [{ amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx]) }];
    var sharesOwned = 1;
    // reinvest dividends received month-end at the beginning of the next month
    for (var n = buyIdx; n < sellIdx - 1; ++n) {
        var divToday = aoa[n].div; // dollars
        var priceTomorrow = aoa[n + 1].price; // dollars per share
        sharesOwned += divToday / priceTomorrow; // dollars / (dollars per share) = shares
    }
    // collect final month's dividend as cash
    transactions.push({ amount: aoa[sellIdx - 1].div, when: mdToDate(aoa[sellIdx - 1], 28) });
    // Sell at the beginning of the final month
    transactions.push({ amount: roundCents(aoa[sellIdx].price * sharesOwned), when: mdToDate(aoa[sellIdx]) });
    if (verbose)
        console.log(transactions, '# shares', sharesOwned);
    return xirr(transactions);
}
exports.reinvestBetween = reinvestBetween;
function dollarCostAverageBetween(aoa, buyIdx, sellIdx, verbose) {
    if (verbose === void 0) { verbose = false; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    // Buy first of month
    var transactions = [{ amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx]) }];
    var sharesOwned = 1;
    for (var n = buyIdx; n < sellIdx - 1; ++n) {
        var divToday = aoa[n].div; // dollars
        var priceTomorrow = aoa[n + 1].price; // dollars per share
        sharesOwned += divToday / priceTomorrow; // dollars / (dollars per share) = shares
        transactions.push({ amount: -priceTomorrow, when: mdToDate(aoa[n + 1]) });
        sharesOwned += 1;
    }
    transactions.push({ amount: aoa[sellIdx - 1].div, when: mdToDate(aoa[sellIdx - 1], 28) });
    // Sell at the beginning of the final month
    transactions.push({ amount: roundCents(aoa[sellIdx].price * sharesOwned), when: mdToDate(aoa[sellIdx]) });
    if (verbose)
        console.log(transactions, '# shares', sharesOwned);
    return xirr(transactions);
}
exports.dollarCostAverageBetween = dollarCostAverageBetween;
/**
 * Each month, invest the CPI that month in dollars in the stock market. Reinvest dividends.
 *
 * The notion is that, your wages will sort-of track CPI (Consumer Price Index), and you allocate CPI
 * dollars each month to your retirement savings.
 */
function dollarCostAverageCPIBetween(aoa, buyIdx, sellIdx, verbose) {
    if (verbose === void 0) { verbose = false; }
    if (buyIdx >= sellIdx) {
        throw new Error('must sell strictly after buying');
    }
    if (buyIdx < 0 || sellIdx >= aoa.length) {
        throw new Error('buy and sell indexes out of bounds');
    }
    // Invest $CPI at the beginning of the month
    var transactions = [{ amount: -aoa[buyIdx].cpi, when: mdToDate(aoa[buyIdx]) }];
    var sharesOwned = aoa[buyIdx].cpi / aoa[buyIdx].price;
    for (var n = buyIdx; n < sellIdx - 1; ++n) {
        // reinvest dividends at the end of each month
        var divToday = aoa[n].div; // dollars
        var priceTomorrow = aoa[n + 1].price; // dollars per share
        sharesOwned += divToday / priceTomorrow; // dollars / (dollars per share) = shares
        // invest $CPI (of the next month) at the start of the next month
        var cpiTomorrow = aoa[n + 1].cpi;
        transactions.push({ amount: -cpiTomorrow, when: mdToDate(aoa[n + 1]) });
        sharesOwned += cpiTomorrow / priceTomorrow;
    }
    // Keep final dividend payment at the end of the month as cash
    transactions.push({ amount: aoa[sellIdx - 1].div, when: mdToDate(aoa[sellIdx - 1], 28) });
    // Sell at the beginning of the final month
    transactions.push({ amount: roundCents(aoa[sellIdx].price * sharesOwned), when: mdToDate(aoa[sellIdx]) });
    var ror = xirr(transactions);
    if (verbose)
        console.log(transactions, '# shares', sharesOwned, 'ror', ror);
    return ror;
}
exports.dollarCostAverageCPIBetween = dollarCostAverageCPIBetween;
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
    console.log("XIRR = " + f(lumpBetween(aoa, start, end)) + "%");
    console.log('## Buy once, reinvest dividends, sell later');
    console.log("XIRR = " + f(reinvestBetween(aoa, start, end)) + "%");
    console.log('## Dollar-cost-average (buy a share every month), reinvest dividends, sell later');
    console.log("XIRR = " + f(dollarCostAverageBetween(aoa, start, end)) + "%");
    console.log('## Dollar-cost-average (invest $CPI each month), reinvest dividends, sell later');
    console.log("XIRR = " + f(dollarCostAverageCPIBetween(aoa, start, end)) + "%");
    // console.log(aoa[start], aoa[end])
    console.log('## Ten year horizons');
    horizonReturns(aoa, 10).forEach(function (y) { return console.log(horizonToTSV(y)); });
    console.log('## 30 year horizons');
    horizonReturns(aoa, 30).forEach(function (y) { return console.log(horizonToTSV(y)); });
    console.log('## 50 year horizons');
    horizonReturns(aoa, 50).forEach(function (y) { return console.log(horizonToTSV(y)); });
}
exports.analyze = analyze;
function horizonToTSV(y) {
    var d = y.starting.toISOString().split('T')[0];
    var x = y.xirr;
    return d + "\t" + x;
}
exports.horizonToTSV = horizonToTSV;
function horizonReturns(aoa, nyears, f) {
    if (nyears === void 0) { nyears = 10; }
    if (f === void 0) { f = undefined; }
    if (typeof f === 'undefined') {
        f = dollarCostAverageCPIBetween;
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
function arrayBufferToWorkbook(buf) { return xlsx_1.default.read(new Uint8Array(buf), { type: "array" }); }
exports.arrayBufferToWorkbook = arrayBufferToWorkbook;
function getRawData(url) {
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
exports.getRawData = getRawData;
