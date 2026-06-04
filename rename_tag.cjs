const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let reviews = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

reviews.forEach(r => {
  if (r.tags) {
    r.tags = r.tags.map(t => t === '질의응답' ? '상담' : t);
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(reviews, null, 2));
console.log('Updated reviews.json');

// Now update Excel
const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

data.forEach(row => {
  let keywordsStr = row['핵심 키워드 (필터용)'];
  if (keywordsStr) {
    let keywords = keywordsStr.split(',').map(k => k.trim());
    let newKeywords = keywords.map(k => k === '질의응답' ? '상담' : k);
    row['핵심 키워드 (필터용)'] = newKeywords.join(', ');
  }
});

const newWs = xlsx.utils.json_to_sheet(data);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, excelFile);
console.log('Updated reviews_with_keywords.xlsx');
