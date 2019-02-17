import fetchPonyfill from 'fetch-ponyfill';

import {
  arrayBufferToWorkbook,
  // dollarCostAverageBetween,
  dollarCostAverageCPIBetween,
  getWorkbook,
  horizonReturns,
  MonthlyData,
  parseWorkbook,
  SHILLER_IE_XLS_URL
} from './shiller';

var Plotly = require('plotly.js-basic-dist');
var median = require('median-quickselect');

const {fetch} = fetchPonyfill();

export async function generateAllData() {
  let aoa: MonthlyData[];

  const datapath = 'data/';
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

  return [15, 30, 45].map(years => ({years, returns: horizonReturns(aoa, years, dollarCostAverageCPIBetween)}));
}

export async function render() {
  let data = await generateAllData();
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.ending);
    let y = ret.map(h => h.xirr * 100);
    let medianReturn: number = median(y.slice());
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
  let domNode = document.getElementById('tester');
  Plotly.plot(domNode, traces, {title, xaxis, yaxis});
}