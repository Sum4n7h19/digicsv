'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Papa from 'papaparse';

type CSVRow = {
  latitude: string;
  longitude: string;
  [key: string]: string;
};

export default function DigiPinConverter() {
  const [rawData, setRawData] = useState<CSVRow[]>([]);
  const [processedData, setProcessedData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessedData([]);
    setDownloadUrl(null);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        const cleaned = results.data.filter((row) => row.latitude && row.longitude);
        setRawData(cleaned);
        setHeaders(Object.keys(cleaned[0]));
      },
    });
  };

  const handleProcess = () => {
    setProcessing(true);

    const enriched = rawData.map((row) => {
      const lat = parseFloat(row.latitude);
      const lon = parseFloat(row.longitude);
      const digipin = getDIGIPIN(lat, lon);
      return { ...row, digipin };
    });

    const csv = Papa.unparse(enriched);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    setProcessedData(enriched);
    setDownloadUrl(url);
    setHeaders([...headers, 'digipin']);
    setProcessing(false);
  };

  const getDIGIPIN = (lat: number, lon: number): string => {
    const L = [
      ['F', 'C', '9', '8'],
      ['J', '3', '2', '7'],
      ['K', '4', '5', '6'],
      ['L', 'M', 'P', 'T']
    ];

    let vDIGIPIN = '';
    let row = 0, column = 0;
    let MinLat = 2.5, MaxLat = 38.50, MinLon = 63.50, MaxLon = 99.50;
    const LatDivBy = 4, LonDivBy = 4;

    if (lat < MinLat || lat > MaxLat || lon < MinLon || lon > MaxLon) return 'Out of Bound';

    for (let Lvl = 1; Lvl <= 10; Lvl++) {
      const LatDivDeg = (MaxLat - MinLat) / LatDivBy;
      const LonDivDeg = (MaxLon - MinLon) / LonDivBy;

      let NextLvlMaxLat = MaxLat;
      let NextLvlMinLat = MaxLat - LatDivDeg;

      for (let x = 0; x < LatDivBy; x++) {
        if (lat >= NextLvlMinLat && lat < NextLvlMaxLat) {
          row = x;
          break;
        } else {
          NextLvlMaxLat = NextLvlMinLat;
          NextLvlMinLat = NextLvlMaxLat - LatDivDeg;
        }
      }

      let NextLvlMinLon = MinLon;
      let NextLvlMaxLon = MinLon + LonDivDeg;

      for (let x = 0; x < LonDivBy; x++) {
        if (lon >= NextLvlMinLon && lon < NextLvlMaxLon) {
          column = x;
          break;
        } else if ((NextLvlMinLon + LonDivDeg) < MaxLon) {
          NextLvlMinLon = NextLvlMaxLon;
          NextLvlMaxLon = NextLvlMinLon + LonDivDeg;
        } else {
          column = x;
        }
      }

      if (Lvl === 1 && L[row][column] === '0') return 'Out of Bound';

      vDIGIPIN += L[row][column];
      if (Lvl === 3 || Lvl === 6) vDIGIPIN += '-';

      MinLat = NextLvlMinLat;
      MaxLat = NextLvlMaxLat;
      MinLon = NextLvlMinLon;
      MaxLon = NextLvlMaxLon;
    }

    return vDIGIPIN;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex flex-col items-center justify-center p-4 space-y-4">
        <center>
          <h1 className="text-2xl font-bold text-center leading-relaxed">
            Centre of Excellence in Land Administration and Management
            <br />
            Administrative Training Institute (ATI), Mysuru, Karnataka
            <br />
            An Initiative of Department of Land Resources, Ministry of Rural Development, Government of India
          </h1>
        </center>

        <Card className="w-full max-w-6xl border border-black">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-bold">DIGIPIN Generator from CSV</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input className="border border-black" type="file" accept=".csv" onChange={handleFileUpload} />
              <a
                href="https://raw.githubusercontent.com/Sum4n7h19/digicsv/refs/heads/master/sample/sample.csv"
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="border border-black">
                  Download Sample CSV
                </Button>
              </a>
            </div>

            {rawData.length > 0 && processedData.length === 0 && (
              <>
                <div className="mt-4 overflow-auto max-h-[300px] border border-black rounded-md">
                  <table className="table-auto w-full text-sm border border-black">
                    <thead>
                      <tr className="bg-gray-100">
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 border border-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawData.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="even:bg-gray-50">
                          {headers.map((h, i) => (
                            <td key={i} className="px-3 py-1 border border-black">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">Previewing 10 rows</p>
                <Button className="mt-3" onClick={handleProcess} disabled={processing}>
                  {processing ? 'Processing...' : 'Process DIGIPIN'}
                </Button>
              </>
            )}

            {processedData.length > 0 && (
              <>
                <div className="mt-4 overflow-auto max-h-[300px] border border-black rounded-md">
                  <table className="table-auto w-full text-sm border border-black">
                    <thead>
                      <tr className="bg-green-100">
                        {headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 border border-black">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className="even:bg-green-50">
                          {headers.map((h, i) => (
                            <td key={i} className="px-3 py-1 border border-black">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">Processed and previewing 10 rows</p>
                {downloadUrl && (
                  <a href={downloadUrl} download="digipin_output.csv">
                    <Button className="mt-3">Download DIGIPIN CSV</Button>
                  </a>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="text-sm w-full mt-auto bg-gray-100 py-3 px-4 border-t">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <p>
            Application by: Sumanth M, Centre of Excellence in Land Administration
            and Management, ATI, Mysuru
          </p>
          <p>
            Special Thanks to: Ministry of Communications Department of Posts for
            providing DIGIPIN Algorithm for Implementation
          </p>
          <a
            href="https://www.mydigipin.com/p/digipin.html"
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source: DIGIPIN Documentation
          </a>
        </div>
      </footer>
    </div>
  );
}
