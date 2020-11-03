import {MonthlyData} from './shiller';

var dsv = require('d3-dsv');

const columnsExpected = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume'];

export function parseRawCSV(raw: string): MonthlyData[] {
  let csv: any[]&{columns: any} = dsv.csvParse(raw);
  if (csv.columns.join(',') !== columnsExpected.join(',')) { throw new Error('unexpected columns'); }
  let aoa: MonthlyData[] = csv.map((o: any) => {
                                if (!o['Adj Close'] || o['Adj Close'] === 'null') { return null; }
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
                              })
                               .filter(x => !!x) as MonthlyData[];
  return aoa;
}
