import XLSX from 'xlsx';
var median = require('median-quickselect');

import {
  dollarCostAverageBetween,
  dollarCostAverageBetweenExcess,
  getWorkbook,
  horizonReturns,
  MonthlyData,
  parseWorkbook,
  SHILLER_IE_XLS_URL
} from './shiller';
import {parseRawCSV} from './yahoo-finance';

if (module === require.main) {
  var {existsSync, readFileSync, writeFileSync} = require('fs');
  const datapath = 'data/';
  const xlsfile = datapath + SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
  const jsonfile = xlsfile + '.json';
  (async () => {
    let monthlyData: MonthlyData[] = [];
    if (existsSync(jsonfile)) {
      monthlyData = JSON.parse(readFileSync(jsonfile, 'utf8'))
    } else {
      let workbook: XLSX.WorkBook;
      if (existsSync(xlsfile)) {
        workbook = XLSX.readFile(xlsfile);
      } else {
        workbook = await getWorkbook();
      }
      monthlyData = parseWorkbook(workbook);
      writeFileSync(jsonfile, JSON.stringify(monthlyData, null, 1));
    }

    const years = [10, 20, 40, 60, 100];
    let data = years.map(y => {
      const returns = horizonReturns(monthlyData, y, dollarCostAverageBetweenExcess);
      return {years: y, median: median(returns.map(o => o.xirr)) || 0, returns};
    });
    writeFileSync(`${datapath}realExcessReturns.json`, JSON.stringify(data));
  })();
}