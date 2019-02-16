import fetchPonyfill from 'fetch-ponyfill';
import {arrayBufferToWorkbook, getRawData, horizonReturns, MonthlyData, parse, SHILLER_IE_XLS_URL} from './index';
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
      aoa = parse(arrayBufferToWorkbook(await xlsFetched.arrayBuffer()));
    } else {
      aoa = parse(await getRawData());
    }
  }

  return [10, 25, 50].map(years => ({years, returns: horizonReturns(aoa, years)}));
}

export async function render() {
  let data = await generateAllData();
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.starting);
    let y = ret.map(h => h.xirr * 100);
    let medianReturn: number = median(y);
    return {
      x,
      y,
      name: `${horizon.years}y; median=${medianReturn.toFixed(1)}%`,
      line: {width: (1 + hidx + (hidx > 2 ? 2 : 0))}
    };
  });
  let title = 'S&P500: monthly dollar-cost-averaging $CPI, reinvesting dividends, before selling everything';
  let domNode = document.getElementById('tester');
  Plotly.plot(domNode, traces, {title});
}