import fetchPonyfill from 'fetch-ponyfill';

import {
  arrayBufferToWorkbook,
  dollarCostAverageBetween,
  dollarCostAverageCPIBetween,
  getWorkbook,
  horizonReturns,
  MonthlyData,
  parseWorkbook,
  SHILLER_IE_XLS_URL
} from './shiller';
import {parseRawCSV} from './yahoo-finance';

var Plotly = require('plotly.js-basic-dist');
var median = require('median-quickselect');

const {fetch} = fetchPonyfill();

const horizons = [15, 30, 45, 60];
const NIKKEI_FILE = '^N225.csv';
const datapath = 'data/';

export async function shiller() {
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

  return horizons.map(years => ({years, returns: horizonReturns(aoa, years, dollarCostAverageCPIBetween)}));
}

export async function nikkei() {
  let nFetched = await fetch(datapath + NIKKEI_FILE);
  let naoa: MonthlyData[] = [];
  if (nFetched.ok) {
    naoa = parseRawCSV(await nFetched.text());
    return horizons.map(years => ({years, returns: horizonReturns(naoa, years, dollarCostAverageBetween)}));
  }
}

export async function render() {
  let data = await shiller();
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.ending);
    let y = ret.map(h => h.xirr * 100);
    let medianReturn: number = median(y.slice()) || 0;
    return {
      x,
      y,
      name: `${horizon.years}y; median=${medianReturn.toFixed(1)}%`,
      line: {width: horizon.years < 10 ? 0.5 : (1 + hidx)}
    };
  });
  let title = {text: 'S&P500: monthly dollar-cost-averaging $CPI (reinvesting dividends), before selling everything'};
  let xaxis = {title: {text: 'Sell date'}};
  let yaxis = {title: {text: 'Annualized rate of return (%)'}};

  Plotly.plot(document.getElementById('snp'), traces, {title, xaxis, yaxis});

  let nhorizons = await nikkei();
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