// require('isomorphic-fetch');
import fetchPonyfill from 'fetch-ponyfill';
const {fetch, Request, Response, Headers} = fetchPonyfill();
import XLSX from 'xlsx';
const xirr = require('xirr');

const SHILLER_IE_XLSX_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
const DATA_SHEETNAME = 'Data';

const HEADER_ROW_A1 = '8';
const HEADER_DATE = 'Date';
const HEADER_P = 'P';
const HEADER_D = 'D';

type MonthlyData = {
  year: number,
  month: number,
  price: number,
  div: number
};

function decimalDateToYearMonth(dec: string): [number, number] {
  let [y, m] = dec.split('.');
  if (!m || !y || y.length === 0 || m.length === 0) { throw new Error('bad date'); }
  return [parseInt(y), m === '1' ? 10 : parseInt(m)];
}

export function parse(workbook: XLSX.WorkBook) {
  if (workbook.SheetNames[2] !== DATA_SHEETNAME) { throw new Error('unexpected name of third sheet'); }

  let data = workbook.Sheets[DATA_SHEETNAME];
  let headerRow = 'ABC'.split('').map(col => col + HEADER_ROW_A1).map(a1 => data[a1].v);

  if (headerRow.join(',') !== [HEADER_DATE, HEADER_P, HEADER_D].join(',')) {
    throw new Error('unexpected header on row ' + HEADER_ROW_A1);
  }

  let arr: MonthlyData[] = [];
  let rownum = parseInt(HEADER_ROW_A1) + 1;
  while (typeof data['C' + rownum] !== 'undefined') {
    let [year, month] = decimalDateToYearMonth(data['A' + rownum].w)
    let price: number = data['B' + rownum].v;
    let div: number = data['C' + rownum].v;
    arr.push({year, month, price, div});
    rownum++;
  }
  return arr;
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

function mdToDate(row: MonthlyData, day = 1) { return new Date(row.year, row.month - 1, day); }

type Transaction = {
  amount: number,
  when: Date
};

/**
 * The convention here is that: you buy at the beginning of the month indicated by `aoa[buyIdx]`. You collect
 * dividends at the end of the month. Then eventually you sell at the first of the month of `aoa[sellIdx]`.
 *
 * This is the dumbest investment scheme: buy a share, save the dividends as cash, and sell.
 * @param aoa
 * @param buyIdx
 * @param sellIdx
 */
export function lumpBetween(aoa: MonthlyData[], buyIdx: number, sellIdx: number): number {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= aoa.length) { throw new Error('buy and sell indexes out of bounds'); }

  // Buy first of month
  let transactions: Transaction[] = [{amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx])}];

  // Collect dividends every month-end (I assume this is how Shiller data works)
  for (let n = buyIdx; n < sellIdx; ++n) { transactions.push({amount: aoa[n].div, when: mdToDate(aoa[n], 28)}); }

  // Sell at the beginning of the final month
  transactions.push({amount: aoa[sellIdx].price, when: mdToDate(aoa[sellIdx])});

  console.log(transactions);
  return xirr(transactions);
}

function roundCents(n: number) { return Math.floor(n * 100) / 100; }

export function reinvestBetween(aoa: MonthlyData[], buyIdx: number, sellIdx: number) {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= aoa.length) { throw new Error('buy and sell indexes out of bounds'); }

  // Buy first of month
  let transactions: Transaction[] = [{amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx])}];
  let sharesOwned = 1;

  // reinvest dividends received month-end at the beginning of the next month
  for (let n = buyIdx; n < sellIdx - 1; ++n) {
    let divToday = aoa[n].div;               // dollars
    let priceTomorrow = aoa[n + 1].price;    // dollars per share
    sharesOwned += divToday / priceTomorrow; // dollars / (dollars per share) = shares
  }

  // collect final month's dividend as cash
  transactions.push({amount: aoa[sellIdx - 1].div, when: mdToDate(aoa[sellIdx - 1], 28)});

  // Sell at the beginning of the final month
  transactions.push({amount: roundCents(aoa[sellIdx].price * sharesOwned), when: mdToDate(aoa[sellIdx])});
  console.log(transactions, '# shares', sharesOwned);
  return xirr(transactions);
}

export function dollarCostAverageBetween(aoa: MonthlyData[], buyIdx: number, sellIdx: number) {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= aoa.length) { throw new Error('buy and sell indexes out of bounds'); }

  // Buy first of month
  let transactions: Transaction[] = [{amount: -aoa[buyIdx].price, when: mdToDate(aoa[buyIdx])}];
  let sharesOwned = 1;

  for (let n = buyIdx; n < sellIdx - 1; ++n) {
    let divToday = aoa[n].div;               // dollars
    let priceTomorrow = aoa[n + 1].price;    // dollars per share
    sharesOwned += divToday / priceTomorrow; // dollars / (dollars per share) = shares

    transactions.push({amount: -priceTomorrow, when: mdToDate(aoa[n + 1])});
    sharesOwned += 1;
  }

  transactions.push({amount: aoa[sellIdx - 1].div, when: mdToDate(aoa[sellIdx - 1], 28)});

  // Sell at the beginning of the final month
  transactions.push({amount: roundCents(aoa[sellIdx].price * sharesOwned), when: mdToDate(aoa[sellIdx])});
  console.log(transactions, '# shares', sharesOwned);
  return xirr(transactions);
}

export function analyze(aoa: MonthlyData[]) {
  let {min: worstDivRate, max: bestDivRate} = minmax(aoa.map(({price, div}) => div / price));
  let f = (n: number) => (n * 100).toFixed(3);
  console.log('# Dividends')
  console.log(`Worst and best dividend rates: ${f(worstDivRate)}% and ${f(bestDivRate)}%`);

  let start = 0;
  let end = 12;
  console.log('# Buy once, sell later, keep dividends as cash');
  console.log(`XIRR = ${f(lumpBetween(aoa, start, end))}%`);

  console.log('# Buy once, reinvest dividends, sell later');
  console.log(`XIRR = ${f(reinvestBetween(aoa, start, end))}%`);

  console.log('# Dollar-cost-average (buy a share every month), reinvest dividends, sell later');
  console.log(`XIRR = ${f(dollarCostAverageBetween(aoa, start, end))}%`);
  // console.log(aoa[start], aoa[end])
}

export async function getRawData(url = SHILLER_IE_XLSX_URL) {
  return XLSX.read(new Uint8Array(await fetch(url).then(x => x.arrayBuffer())), {type: "array"});
}

if (module === require.main) {
  (async () => {
    let w = XLSX.readFile('ie_data.xls');
    analyze(parse(w));
  })();
}