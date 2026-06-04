const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

let habitCount = 0;
let deviceCount = 0;

data.forEach(r => {
  if (r.tags && r.tags.includes('생활 관리')) {
    // Remove the old tag
    r.tags = r.tags.filter(t => t !== '생활 관리');
    
    const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + (Array.isArray(r.summaryQuote)?r.summaryQuote.join(' '):r.summaryQuote||'')).toLowerCase().replace(/\s+/g, '');
    
    const hasHabit = ['출결', '출석', '지각', '생활패턴', '생활습관', '루틴', '규칙적', '생활관리', '생활상담'].some(k => fullText.includes(k));
    const hasDevice = ['휴대폰', '스마트폰', '핸드폰', '방화벽', '와이파이', '전자기기', '통제', '차단', '수거'].some(k => fullText.includes(k));
    
    if (hasHabit) {
      r.tags.push('출결·생활 습관');
      habitCount++;
    }
    if (hasDevice) {
      r.tags.push('스마트폰·방화벽');
      deviceCount++;
    }
    
    // Fallback just in case it had '생활 관리' but matched neither string
    if (!hasHabit && !hasDevice) {
      r.tags.push('출결·생활 습관'); // Default fallback
      habitCount++;
    }
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
console.log(`Assigned habit: ${habitCount}, device: ${deviceCount}`);
console.log('Updated both files.');
