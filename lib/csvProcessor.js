const Papa = require('papaparse');

class CSVProcessor {
  static parseCSV(csvData) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve({
            data: results.data,
            headers: results.meta.fields || [],
            errors: results.errors
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  static getColumnPreview(csvData, maxRows = 5) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          const preview = {
            headers: results.meta.fields || [],
            sampleRows: results.data.slice(0, maxRows),
            totalRows: results.data.length
          };
          resolve(preview);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  static compareCSVs(file1Data, file2Data, comparisonRules) {
    return new Promise(async (resolve, reject) => {
      try {
        const csv1 = await this.parseCSV(file1Data);
        const csv2 = await this.parseCSV(file2Data);

        const matches = [];
        const missingInFile1 = [];
        const matchedIndices = new Set();

        for (let i = 0; i < csv1.data.length; i++) {
          const row1 = csv1.data[i];
          let foundMatch = false;

          for (const rule of comparisonRules) {
            if (foundMatch) break;

            const value1 = this.normalizeValue(row1[rule.column1]);
            if (!value1) continue;

            for (let j = 0; j < csv2.data.length; j++) {
              if (matchedIndices.has(j)) continue;

              const row2 = csv2.data[j];
              const value2 = this.normalizeValue(row2[rule.column2]);

              if (value1 === value2) {
                matches.push({
                  file1Row: i,
                  file2Row: j,
                  matchedOn: rule.name,
                  column1: rule.column1,
                  column2: rule.column2,
                  value: value1,
                  file1Data: row1,
                  file2Data: row2
                });
                matchedIndices.add(j);
                foundMatch = true;
                break;
              }
            }
          }

          if (!foundMatch) {
            missingInFile1.push({
              rowIndex: i,
              data: row1
            });
          }
        }

        const statistics = {
          file1TotalRows: csv1.data.length,
          file2TotalRows: csv2.data.length,
          matchesFound: matches.length,
          missingInFile1: missingInFile1.length,
          matchRate: ((matches.length / csv1.data.length) * 100).toFixed(2)
        };

        resolve({
          matches,
          missingInFile1,
          statistics,
          file1Headers: csv1.headers,
          file2Headers: csv2.headers
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
  }

  static exportToCSV(data, headers) {
    return Papa.unparse(data, {
      columns: headers,
      header: true
    });
  }
}

module.exports = CSVProcessor;