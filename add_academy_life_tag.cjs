const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const academyLifeKeywords = [
  '버티는데', '버틸수', '의지', '위로', '응원', '챙겨', '재수생활', '수험생활', 
  '멘탈', '마인드', '따뜻한', '격려', '힘들때', '힘들었는데', '포기하고', '안정', '슬럼프', '따스한', '친근', '신경써주셔서'
];

let addedCount = 0;

data.forEach(r => {
  if (!r.tags) r.tags = [];
  
  const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + (Array.isArray(r.summaryQuote)?r.summaryQuote.join(' '):r.summaryQuote||'')).toLowerCase().replace(/\s+/g, '');
  
  const isMatch = academyLifeKeywords.some(k => fullText.includes(k));
  
  if (isMatch && !r.tags.includes('학원 생활')) {
    r.tags.push('학원 생활');
    addedCount++;
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

// Update Excel
const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(ws);

excelData.forEach(row => {
  let review = data.find(r => r.id === row.ID);
  if (review) {
    row['핵심 키워드 (필터용)'] = review.tags.join(', ');
  }
});

const newWs = xlsx.utils.json_to_sheet(excelData);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, excelFile);
console.log(`Added '학원 생활' to ${addedCount} reviews.`);
