import fetchPonyfill from 'fetch-ponyfill';
import XLSX from 'xlsx';

const {fetch} = fetchPonyfill();
const xirr: (trans: Transaction[], opts?: any, guess?: number) => number = require('./xirr');

export const SHILLER_IE_XLS_URL = 'http://www.econ.yale.edu/~shiller/data/ie_data.xls';
const DATA_SHEETNAME = 'Data';

const HEADER_ROW_A1 = '8';
const HEADER_DATE = 'Date';
const HEADER_P = 'P';
const HEADER_D = 'D';
const HEADER_CPI = 'CPI';
const HEADER_10YR_RATE = 'Rate GS10';
const HEADER_REAL_PRICE = 'Price';
const HEADER_REAL_DIVIDEND = 'Dividend';

export type MonthlyData = {
  year: number,
  month: number,
  price: number,
  div: number,
  cpi: number,
  interest10y: number,
  realPrice: number,
  realDiv: number,
};

export type Horizon = {
  starting: Date,
  ending: Date,
  xirr: number,
};

type Transaction = {
  amount: number,
  when: Date
};

function decimalDateToYearMonth(dec: string): [number, number] {
  let [y, m] = dec.split('.');
  if (!m || !y || y.length === 0 || m.length === 0) { throw new Error('bad date'); }
  return [parseInt(y), m === '1' ? 10 : parseInt(m)];
}

export function parseWorkbook(workbook: XLSX.WorkBook) {
  if (workbook.SheetNames[2] !== DATA_SHEETNAME) { throw new Error('unexpected name of third sheet'); }

  let data = workbook.Sheets[DATA_SHEETNAME];
  let headerRow = 'ABCEGHI'.split('').map(col => col + HEADER_ROW_A1).map(a1 => data[a1].v);

  if (headerRow.join(',') !== [
        HEADER_DATE, HEADER_P, HEADER_D, HEADER_CPI, HEADER_10YR_RATE, HEADER_REAL_PRICE, HEADER_REAL_DIVIDEND
      ].join(',')) {
    throw new Error('unexpected header on row ' + HEADER_ROW_A1);
  }

  let arr: MonthlyData[] = [];
  let rownum = parseInt(HEADER_ROW_A1) + 1;
  while (typeof data['C' + rownum] !== 'undefined') {
    let [year, month] = decimalDateToYearMonth(data['A' + rownum].w)
    let price: number = data['B' + rownum].v;
    let div: number = data['C' + rownum].v;
    let cpi: number = data['E' + rownum].v;
    let interest10y: number = data['G' + rownum].v;
    let realPrice: number = data['H' + rownum].v;
    let realDiv: number = data['I' + rownum].v;
    arr.push({year, month, price, div, cpi, interest10y, realPrice, realDiv});
    rownum++;
  }
  return arr;
}

export function mdToDate(row: MonthlyData, day = 1) { return new Date(Date.UTC(row.year, row.month - 1, day)); }

/**
 * Each month, invest in the stock market (real price, CPI-adjusted), either $1 or 1 share. Reinvest.
 *
 * The assumption is that each month the dividend is paid at the *end* of each month whereas the price corresponds to
 * the price at the *beginning* of the month, so we reinvest with the beginning of next month's price.
 */
export function dollarCostAverageBetween(aoa: MonthlyData[], buyIdx: number, sellIdx: number,
                                         monthlyScheme: 'dollar'|'share' = 'dollar', verbose = false) {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= aoa.length) { throw new Error('buy and sell indexes out of bounds'); }

  // Invest $1 at the beginning of the month

  let monthlyInvestment = monthlyScheme === 'dollar' ? 1 : aoa[buyIdx].realPrice;
  let transactions: Transaction[] = [{amount: -monthlyInvestment, when: mdToDate(aoa[buyIdx])}];
  let sharesOwned = monthlyInvestment / aoa[buyIdx].realPrice;

  for (let n = buyIdx + 1; n < sellIdx; ++n) {
    let monthlyInvestment = monthlyScheme === 'dollar' ? 1 : aoa[n].realPrice;

    // reinvest dividends at the end of each month
    const priceToday = aoa[n].realPrice;                        // dollars per share
    const divYesterday = aoa[n - 1].realDiv / 12 * sharesOwned; // dollars = dividend dollars per share * shares owned
    sharesOwned += divYesterday / priceToday;                   // dollars / (dollars per share) = shares

    // invest $1 (of the next month) at the start of the next month
    transactions.push({amount: -monthlyInvestment, when: mdToDate(aoa[n])});
    sharesOwned += monthlyInvestment / priceToday;
  }
  // Keep final dividend payment at the end of the month as cash
  // Sell at the beginning of the final month
  transactions.push({
    amount: aoa[sellIdx].realPrice * sharesOwned + aoa[sellIdx - 1].realDiv * sharesOwned,
    when: mdToDate(aoa[sellIdx])
  });
  try {
    return xirr(transactions, {verbose, maxIterations: 2000}, 0.05);
  } catch (e) {
    console.log(
        transactions
            .map(
                (o, i) => [o.amount, [o.when.getUTCFullYear(), o.when.getUTCMonth() + 1, o.when.getUTCDate()].join('/'),
                           aoa[buyIdx + i].realPrice, aoa[buyIdx + i].realDiv]
                              .join('\t'))
            .join('\n'))
    throw e;
  }
}

export function dollarCostAverageBetweenExcess(data: MonthlyData[], buyIdx: number, sellIdx: number,
                                               tenYearToMonthlyDiscount = 1.0) {
  return dollarCostAverageBetween(data, buyIdx, sellIdx) -
         riskfreeBetween(data, buyIdx, sellIdx, tenYearToMonthlyDiscount);
}
export function riskfreeBetween(data: MonthlyData[], buyIdx: number, sellIdx: number, tenYearToMonthlyDiscount = 1.0) {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= data.length) { throw new Error('buy and sell indexes out of bounds'); }
  let cash = 0;
  let transactions: Transaction[] = [];
  for (let n = buyIdx; n < sellIdx; ++n) {
    const thisMonth = data[n];
    // earn interest
    cash += cash * thisMonth.interest10y / 100 / 12 * tenYearToMonthlyDiscount;
    // put $1 into savings account
    cash += 1;
    transactions.push({amount: -1, when: mdToDate(data[n])});
  }
  const finalInterest = cash * data[sellIdx].interest10y / 100 / 12 * tenYearToMonthlyDiscount;
  transactions.push({amount: cash + finalInterest, when: mdToDate(data[sellIdx])});
  return xirr(transactions);
}

export function horizonReturns(aoa: MonthlyData[], nyears = 10, f: any = undefined) {
  if (typeof f === 'undefined') { f = dollarCostAverageBetween; }
  let months = nyears * 12;
  let lastStart = aoa.length - months;
  let ret: Horizon[] = [];
  for (let start = 0; start < lastStart; ++start) {
    let ror = f(aoa, start, start + months);
    ret.push({starting: mdToDate(aoa[start]), ending: mdToDate(aoa[start + months]), xirr: ror});
  }
  return ret;
}

export async function getArrayBuffer(url = SHILLER_IE_XLS_URL) { return fetch(url).then(x => x.arrayBuffer()); }
export function arrayBufferToWorkbook(buf: ArrayBuffer) { return XLSX.read(new Uint8Array(buf), {type: "array"}); }
export async function getWorkbook(url = SHILLER_IE_XLS_URL) { return arrayBufferToWorkbook(await getArrayBuffer(url)); }

export function dcaCPISkip(aoa: MonthlyData[], buyIdx: number, sellIdx: number, skipIdxs?: Set<number>) {
  if (buyIdx >= sellIdx) { throw new Error('must sell strictly after buying'); }
  if (buyIdx < 0 || sellIdx >= aoa.length) { throw new Error('buy and sell indexes out of bounds'); }
  const skips: Set<number> = skipIdxs || new Set();

  let cash = 0;

  // Invest $CPI at the beginning of the month
  let transactions: Transaction[] = [{amount: -aoa[buyIdx].cpi, when: mdToDate(aoa[buyIdx])}];
  let sharesOwned = aoa[buyIdx].cpi / aoa[buyIdx].realPrice;

  for (let n = buyIdx; n < sellIdx - 1; ++n) {
    // reinvest dividends at the end of each month
    const divToday = aoa[n].realDiv;            // dollars
    const priceTomorrow = aoa[n + 1].realPrice; // dollars per share
    sharesOwned += divToday / priceTomorrow;    // dollars / (dollars per share) = shares

    // invest $CPI (of the next month) at the start of the next month, either in stock or cash
    // interest payment on existing cash
    cash += cash * (aoa[n].interest10y / 100 / 12 * 0.8); // discount the 10year rate to get ~monthly FORGIVEME
    const cpiTomorrow = aoa[n + 1].cpi;
    if (skips.has(n + 1)) {
      cash += cpiTomorrow;
    } else {
      sharesOwned += cpiTomorrow / priceTomorrow;
    }
    transactions.push({amount: -cpiTomorrow, when: mdToDate(aoa[n + 1])});
  }

  // Keep final dividend payment at the end of the month as cash, along with actual cash
  transactions.push({amount: aoa[sellIdx - 1].realDiv + cash, when: mdToDate(aoa[sellIdx - 1], 28)});

  // Sell at the beginning of the final month
  transactions.push({amount: aoa[sellIdx].realPrice * sharesOwned, when: mdToDate(aoa[sellIdx])});
  return xirr(transactions);
}

if (require.main === module) {
  var {readFileSync} = require('fs');
  var df: MonthlyData[] = JSON.parse(readFileSync('data/ie_data.xls.json', 'utf8'));
  var slice = df.slice(df.length - 12 * 40);
  var totalXirr = dcaCPISkip(slice, 0, slice.length - 1, new Set());
  var missedOneXirrs = [];
  for (let n = 0; n < slice.length - 2; n++) {
    missedOneXirrs.push(dcaCPISkip(slice, 0, slice.length - 1, new Set([n + 1])))
  }
  console.log({totalXirr});
  console.log(missedOneXirrs);
}