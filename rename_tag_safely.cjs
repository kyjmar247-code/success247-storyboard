const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

let replaceCount = 0;
data.forEach(r => {
  if (r.tags && r.tags.includes('학습 계획 및 플래너')) {
    r.tags = r.tags.map(t => t === '학습 계획 및 플래너' ? '학습 계획 및 관리' : t);
    replaceCount++;
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(ws);

excelData.forEach(row => {
  if (row['핵심 키워드 (필터용)'] === '학습 계획 및 플래너') {
    row['핵심 키워드 (필터용)'] = '학습 계획 및 관리';
  }
});

const newWs = xlsx.utils.json_to_sheet(excelData);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, excelFile);

console.log(`Renamed tag for ${replaceCount} reviews.`);
