import fetchPonyfill from 'fetch-ponyfill';

import {
  arrayBufferToWorkbook,
  dcaCPISkip,
  dollarCostAverageBetween,
  dollarCostAverageBetweenExcess,
  dollarCostAverageCPIBetween,
  getWorkbook,
  horizonReturns,
  mdToDate,
  MonthlyData,
  parseWorkbook,
  SHILLER_IE_XLS_URL
} from './shiller';
import {parseRawCSV} from './yahoo-finance';

var Plotly = require('plotly.js-basic-dist');
var median = require('median-quickselect');

const {fetch} = fetchPonyfill();

const horizons = [10, 20, 45, 60];
const NIKKEI_FILE = '^N225.csv';
const datapath = 'data/';
const shillerDataP = loadShiller();

export async function loadShiller() {
  let aoa: MonthlyData[];

  const xlsfile = datapath + SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
  const jsonfile = xlsfile + '.json';

  let jsonFetched = await fetch(jsonfile);
  if (jsonFetched.ok) {
    aoa = await jsonFetched.json();
  } else {
    let xlsFetched = await fetch(xlsfile);
    if (xlsFetched.ok) {
      aoa = parseWorkbook(arrayBufferToWorkbook(await xlsFetched.arrayBuffer()));
    } else {
      aoa = parseWorkbook(await getWorkbook());
    }
  }
  return aoa;
}

export function shillerToHorizonsData(aoa: MonthlyData[]) {
  return horizons.map(years => ({years, returns: horizonReturns(aoa, years, dollarCostAverageCPIBetween)}));
}

export async function nikkeiHorizonsData() {
  let nFetched = await fetch(datapath + NIKKEI_FILE);
  let naoa: MonthlyData[] = [];
  if (nFetched.ok) {
    naoa = parseRawCSV(await nFetched.text());
    return horizons.map(years => ({years, returns: horizonReturns(naoa, years, dollarCostAverageBetween)}));
  }
}

export async function renderExcess() {
  let monthlyData = await shillerDataP;
  let data =
      horizons.map(years => ({years, returns: horizonReturns(monthlyData, years, dollarCostAverageBetweenExcess)}));
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.ending);
    let y = ret.map(h => h.xirr * 100);
    let medianReturn: number = median(y.slice()) || 0;
    return {
      x,
      y,
      name: `${horizon.years}y; median=${Math.round(medianReturn * 100) / 100}%`,
      line: {width: horizon.years < 10 ? 0.5 : (1 + hidx)}
    };
  });
  let title = {
    text: 'Monthly dollar-cost-averaging $CPI S&P500, reinvesting dividends: returns in excess of Treasury yields'
  };
  let xaxis = {title: {text: 'Horizon end date'}};
  let yaxis = {title: {text: 'Annualized rate of return (%)'}};

  Plotly.plot(document.getElementById('excess'), traces, {title, xaxis, yaxis});
}

export async function renderSnp500Nikkei() {
  let data = shillerToHorizonsData(await shillerDataP);
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.ending);
    let y = ret.map(h => h.xirr * 100);
    let medianReturn: number = median(y.slice()) || 0;
    return {
      x,
      y,
      name: `${horizon.years}y; median=${Math.round(medianReturn * 100) / 100}%`,
      line: {width: horizon.years < 10 ? 0.5 : (1 + hidx)}
    };
  });
  let title = {text: 'S&P500: monthly dollar-cost-averaging $CPI (reinvesting dividends), over investing horizons'};
  let xaxis = {title: {text: 'Horizon end date'}};
  let yaxis = {title: {text: 'Annualized rate of return (%)'}};

  Plotly.plot(document.getElementById('snp'), traces, {title, xaxis, yaxis});

  let nhorizons = await nikkeiHorizonsData();
  if (typeof nhorizons !== 'undefined') {
    let traces = nhorizons.map((horizon, hidx) => {
      let ret = horizon.returns;
      let x = ret.map(h => h.ending);
      let y = ret.map(h => h.xirr * 100);
      let medianReturn: number = median(y.slice()) || 0;
      return {
        x,
        y,
        name: `N225 ${horizon.years}y; median=${medianReturn.toFixed(1)}%`,
        line: {width: horizon.years < 10 ? 0.5 : (1 + hidx)}
      };
    });
    let title = {
      text: 'Nikkei225: monthly dollar-cost-averaging one share (reinvesting dividends), before selling everything'
    };
    let xaxis = {title: {text: 'Sell date'}};
    let yaxis = {title: {text: 'Annualized rate of return (%)'}};
    Plotly.plot(document.getElementById('nikkei'), traces, {title, xaxis, yaxis});
  }
}

function missingMonthsMaker(slice: MonthlyData[], nmonths: number) {
  var miss = [];
  var v = Array.from(Array(nmonths), (_, i) => i + 1);
  for (let n = 0; n < slice.length - 2; n++) {
    miss.push(100 * dcaCPISkip(slice, 0, slice.length - 1, new Set(v.map(x => x + n))))
  }
  return miss;
}

function missingMonthsAnalysis(df: MonthlyData[], horizonYears = 40, skipLatestYears = 0) {
  var slice = skipLatestYears ? df.slice(df.length - 12 * horizonYears - skipLatestYears * 12, -skipLatestYears * 12)
                              : df.slice(df.length - 12 * horizonYears);
  var totalXirr = dcaCPISkip(slice, 0, slice.length - 1, new Set());

  var missedOneXirrs = missingMonthsMaker(slice, 1);

  var dates = missedOneXirrs.map((_, i) => mdToDate(slice[i]));
  var sameparams = {x: dates, line: {width: 2}, opacity: .5};
  var traces = [
    {x: dates, y: slice.map(o => o.price), name: 'S&P500 price', yaxis: 'y2', line: {width: 2}},
    {...sameparams, y: missedOneXirrs, name: 'missing 1 mo.'},
    {...sameparams, y: missingMonthsMaker(slice, 3), name: 'missing 3 mo.'},
    {...sameparams, y: missingMonthsMaker(slice, 6), name: 'missing 6 mo.'},
    {...sameparams, y: missingMonthsMaker(slice, 9), name: 'missing 9 mo.'},
    {...sameparams, y: missingMonthsMaker(slice, 12), name: 'missing 12 mo.'},
  ];
  let xaxis = {title: {text: 'Date'}};
  let yaxis = {title: {text: 'Annualized rate of return (%)'}};

  Plotly.plot(document.getElementById('parp'), traces, {
    xaxis,
    yaxis,
    title: {text: `Annualized returns with NO missed months: ${(totalXirr * 100).toPrecision(3)}%`},
    yaxis2: {title: 'S&P500 price', overlaying: 'y', side: 'right', type: 'log', autorange: true}
  });
}
export async function missingMonthsRender() { missingMonthsAnalysis(await shillerDataP); }
