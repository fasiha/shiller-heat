import fetchPonyfill from 'fetch-ponyfill';
import {arrayBufferToWorkbook, getRawData, horizonReturns, MonthlyData, parse, SHILLER_IE_XLS_URL} from './index';
var Plotly = require('plotly.js-basic-dist');

const {fetch} = fetchPonyfill();

export async function generateAllData() {
  let aoa: MonthlyData[];

  const xlsfile = SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
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

  return [10, 30, 50].map(years => ({years, returns: horizonReturns(aoa, years)}));
}

export async function render() {
  let data = await generateAllData();
  let traces = data.map((horizon, hidx) => {
    let ret = horizon.returns;
    let x = ret.map(h => h.starting);
    let y = ret.map(h => h.xirr * 100);
    return {x, y, name: `${horizon.years}y`, line: {width: (1 + hidx) * (1 + hidx)}};
  });
  let title = 'Monthly dollar-cost-averaging $CPI, reinvesting returns';
  let domNode = document.getElementById('tester');
  Plotly.plot(domNode, traces, {title});
}