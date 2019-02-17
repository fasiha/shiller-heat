import XLSX from 'xlsx';

import {
  dollarCostAverageBetween,
  dollarCostAverageCPIBetween,
  getWorkbook,
  Horizon,
  horizonReturns,
  lumpBetween,
  MonthlyData,
  parseWorkbook,
  reinvestBetween,
  SHILLER_IE_XLS_URL
} from './shiller';
import {parseRawCSV} from './yahoo-finance';

function horizonToTSV(y: Horizon) {
  let d = y.starting.toISOString().split('T')[0];
  let x = y.xirr;
  return `${d}\t${x}`;
}

function minmax(arr: number[]) {
  if (arr.length === 0) { throw new Error('minmax does not work on empty arrays'); }
  let min = arr[0];
  let max = arr[0];
  for (let x of arr) {
    min = Math.min(x, min);
    max = Math.max(x, max);
  }
  return {min, max};
}

function analyze(aoa: MonthlyData[]) {
  let {min: worstDivRate, max: bestDivRate} = minmax(aoa.map(({price, div}) => div / price));
  let f = (n: number) => (n * 100).toFixed(3);
  console.log('# Dividends')
  console.log(`Worst and best dividend rates: ${f(worstDivRate)}% and ${f(bestDivRate)}%`);

  let start = 0;
  let end = 12;
  console.log('## Buy once, sell later, keep dividends as cash');
  console.log(`XIRR = ${f(lumpBetween(aoa, start, end))}%`);

  console.log('## Buy once, reinvest dividends, sell later');
  console.log(`XIRR = ${f(reinvestBetween(aoa, start, end))}%`);

  console.log('## Dollar-cost-average (buy a share every month), reinvest dividends, sell later');
  console.log(`XIRR = ${f(dollarCostAverageBetween(aoa, start, end))}%`);

  console.log('## Dollar-cost-average (invest $CPI each month), reinvest dividends, sell later');
  console.log(`XIRR = ${f(dollarCostAverageCPIBetween(aoa, start, end))}%`);
  // console.log(aoa[start], aoa[end])

  let y = horizonReturns(aoa, 45);
  let sorted = y.map(o => o.xirr).sort((a, b) => a - b);
  let quantilesWanted = [0, .1, .25, .33, .5, .67, .75, .9, 1];
  const getQuantile = (sorted: number[], q: number) => sorted[Math.round(q * sorted.length)];
  let quantiles = quantilesWanted.map(q => getQuantile(sorted, q));
  let table = quantilesWanted.map((q, i) => [q, 100 * quantiles[i]]);
  console.log('# Quantiles');
  console.log(table.map(v => v.join(', ')).join('\n'));
}

if (module === require.main) {
  var {existsSync, readFileSync, writeFileSync} = require('fs');
  const datapath = 'data/';
  const xlsfile = datapath + SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
  const jsonfile = xlsfile + '.json';
  (async () => {
    let aoa: MonthlyData[] = [];
    if (existsSync(jsonfile)) {
      aoa = JSON.parse(readFileSync(jsonfile, 'utf8'))
    } else {
      let workbook: XLSX.WorkBook;
      if (existsSync(xlsfile)) {
        workbook = XLSX.readFile(xlsfile);
      } else {
        workbook = await getWorkbook();
      }
      aoa = parseWorkbook(workbook);
      writeFileSync(jsonfile, JSON.stringify(aoa));
    }
    analyze(aoa);

    let naoa = parseRawCSV(readFileSync(datapath + '^N225.csv', 'utf8'));
    console.log(horizonReturns(naoa, 10, dollarCostAverageBetween));
  })();
}