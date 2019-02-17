import XLSX from 'xlsx';

import {
  analyze,
  dollarCostAverageCPIBetween,
  getRawData,
  horizonReturns,
  horizonToTSV,
  MonthlyData,
  parse,
  SHILLER_IE_XLS_URL
} from './index';

if (module === require.main) {
  var {existsSync, readFileSync, writeFileSync} = require('fs');
  const xlsfile = SHILLER_IE_XLS_URL.split('/').slice(-1)[0];
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
        workbook = await getRawData();
      }
      aoa = parse(workbook);
      writeFileSync(jsonfile, JSON.stringify(aoa));
    }
    let y1 = horizonReturns(aoa, 1, dollarCostAverageCPIBetween);
    y1.forEach(h => console.log(horizonToTSV(h)));
  })();
}