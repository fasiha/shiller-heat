"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dsv = require('d3-dsv');
var columnsExpected = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'];
function parseRawCSV(raw) {
    var csv = dsv.csvParse(raw);
    if (csv.columns.join(',') !== columnsExpected.join(',')) {
        throw new Error('unexpected columns');
    }
    var aoa = csv.map(function (o) {
        var d = new Date(o.Date);
        var md = {
            year: d.getUTCFullYear(),
            month: d.getUTCMonth() + 1,
            price: o['Adj Close'],
            div: 0,
            cpi: 1,
            interest10y: 0,
            realDiv: 0,
            realPrice: o['Adj Close']
        };
        return md;
    });
    return aoa;
}
exports.parseRawCSV = parseRawCSV;
