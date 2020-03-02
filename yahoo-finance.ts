import {MonthlyData} from './shiller';

var dsv = require('d3-dsv');

const columnsExpected = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'];

export function parseRawCSV(raw: string): MonthlyData[] {
  let csv = dsv.csvParse(raw);
  if (csv.columns.join(',') !== columnsExpected.join(',')) { throw new Error('unexpected columns'); }
  let aoa: MonthlyData[] = csv.map((o: any) => {
    const d = new Date(o.Date);
    let md: MonthlyData = {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      price: o['Adj Close'],
      div: 0,
      cpi: 1,
      interest10y: 0,
      realDiv: 0,
      realPrice: o['Adj Close']
    };
    return md;
  });
  return aoa;
}
