const xlsx = require('xlsx');

const wb = xlsx.readFile('reviews_with_keywords.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

const keywordMap = {
  '입시 관리': '학습·입시 관리',
  '학습 관리': '학습·입시 관리',
  '인강 추천': '학습·입시 관리',
  '이투스 구독': '학습·입시 관리',
  '방화벽': '생활 관리'
};

data.forEach(row => {
  let keywordsStr = row['핵심 키워드 (필터용)'];
  if (keywordsStr) {
    let keywords = keywordsStr.split(',').map(k => k.trim());
    let newKeywords = keywords.map(k => keywordMap[k] || k);
    // Remove duplicates
    newKeywords = [...new Set(newKeywords)];
    row['핵심 키워드 (필터용)'] = newKeywords.join(', ');
  }
});

const newWs = xlsx.utils.json_to_sheet(data);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, 'reviews_with_keywords.xlsx');
console.log('Updated reviews_with_keywords.xlsx successfully.');
