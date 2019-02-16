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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
// require('isomorphic-fetch');
var fetch_ponyfill_1 = __importDefault(require("fetch-ponyfill"));
var _a = fetch_ponyfill_1.default(), fetch = _a.fetch, Request = _a.Request, Response = _a.Response, Headers = _a.Headers;
var xlsx_1 = __importDefault(require("xlsx"));
var xirr = require('xirr');
var SHILLER_IE_XLSX_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
var DATA_SHEETNAME = 'Data';
var HEADER_ROW_A1 = '8';
var HEADER_DATE = 'Date';
var HEADER_P = 'P';
var HEADER_D = 'D';
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
    var headerRow = 'ABC'.split('').map(function (col) { return col + HEADER_ROW_A1; }).map(function (a1) { return data[a1].v; });
    if (headerRow.join(',') !== [HEADER_DATE, HEADER_P, HEADER_D].join(',')) {
        throw new Error('unexpected header on row ' + HEADER_ROW_A1);
    }
    var arr = [];
    var rownum = parseInt(HEADER_ROW_A1) + 1;
    while (typeof data['C' + rownum] !== 'undefined') {
        var _a = __read(decimalDateToYearMonth(data['A' + rownum].w), 2), year = _a[0], month = _a[1];
        var price = data['B' + rownum].v;
        var div = data['C' + rownum].v;
        arr.push({ year: year, month: month, price: price, div: div });
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
    return new Date(row.year, row.month - 1, day);
}
/**
 * The convention here is that: you buy at the beginning of the month indicated by `aoa[buyIdx]`. You collect
 * dividends at the end of the month. Then eventually you sell at the first of the month of `aoa[sellIdx]`.
 * @param aoa
 * @param buyIdx
 * @param sellIdx
 */
function lumpBetween(aoa, buyIdx, sellIdx) {
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
function analyze(aoa) {
    var _a = minmax(aoa.map(function (_a) {
        var price = _a.price, div = _a.div;
        return div / price;
    })), worstDivRate = _a.min, bestDivRate = _a.max;
    console.log([worstDivRate, bestDivRate]);
    var start = 0;
    var end = 12;
    console.log(lumpBetween(aoa, start, end));
    console.log(aoa[start], aoa[end]);
}
exports.analyze = analyze;
function getRawData(url) {
    if (url === void 0) { url = SHILLER_IE_XLSX_URL; }
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(url).then(function (x) { return x.arrayBuffer(); })];
                case 1:
                    p = _a.sent();
                    return [2 /*return*/, xlsx_1.default.read(new Uint8Array(p), { type: "array" })];
            }
        });
    });
}
exports.getRawData = getRawData;
if (module === require.main) {
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var w;
        return __generator(this, function (_a) {
            w = xlsx_1.default.readFile('ie_data.xls');
            analyze(parse(w));
            return [2 /*return*/];
        });
    }); })();
}
