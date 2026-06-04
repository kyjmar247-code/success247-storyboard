const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

// Strict map for summaryQuote
const strictMap = {
  '학습·입시 관리': ['학습입시관리', '학습관리', '학습상담', '입시관리', '입시상담', '인강추천', '이투스구독'],
  '학습 계획': ['학습계획', '매리트'],
  '플래너 관리': ['플래너관리', '플래너'],
  '상담': ['상담', '질의응답'],
  '생활 관리': ['생활관리', '생활상담', '전자출결', '핸드폰수거', '방화벽', '출결', '출석', '생활패턴', '생활습관', '생활루틴'],
  '면학 분위기': ['면학분위기'],
  '졸음 관리': ['졸음관리', '졸음'],
  '모의고사': ['모의고사']
};

// Expanded semantic map for full text (to catch uncategorized ones)
const semanticMap = {
  '학습·입시 관리': ['진도', '방향성', '공부 방향', '성적', '전략', '컨설팅', '코칭'],
  '학습 계획': ['계획', '스케줄', '루틴'],
  '플래너 관리': ['플래너'],
  '상담': ['질문', '답변', '질의응답'],
  '생활 관리': ['생활', '휴대폰', '스마트폰', '출결', '출석', '지각', '통제', '와이파이'],
  '면학 분위기': ['분위기', '환경', '집중', '소음', '자제력'],
  '졸음 관리': ['졸음', '깨워', '잠'],
  '모의고사': ['모의고사', '평가원', '실전', '시험']
};

let modifiedCount = 0;

data.forEach(r => {
  let matchedTags = new Set();
  
  const quoteText = (Array.isArray(r.summaryQuote) ? r.summaryQuote.join(' ') : r.summaryQuote || '').toLowerCase();
  const rawQuoteText = quoteText.replace(/\s+/g, '');
  
  // 1. Strict matching on summaryQuote
  for (const [tag, keywords] of Object.entries(strictMap)) {
    if (keywords.some(k => rawQuoteText.includes(k))) {
      matchedTags.add(tag);
    }
  }

  // 2. If no strict match, use semantic matching on full review text
  if (matchedTags.size === 0) {
    const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
    const rawFullText = fullText.replace(/\s+/g, '');
    
    for (const [tag, keywords] of Object.entries(semanticMap)) {
      if (keywords.some(k => rawFullText.includes(k.replace(/\s+/g, '')))) {
        matchedTags.add(tag);
      }
    }
  }
  
  // Also, the user specifically wants '생활 관리' if '출결' or '출석' is mentioned ANYWHERE in full text?
  // They said "출결 관련 이야기는 #생활 관리 카테고리로 들어가야 해".
  // Let's enforce that if fullText includes '출결' or '출석', give it '생활 관리' regardless of strict map.
  const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
  if (fullText.includes('출결') || fullText.includes('출석')) {
    matchedTags.add('생활 관리');
  }

  const oldTags = r.tags.slice().sort().join(',');
  r.tags = Array.from(matchedTags);
  const newTags = r.tags.slice().sort().join(',');
  
  if (oldTags !== newTags) {
    modifiedCount++;
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
console.log(`Modified reviews: ${modifiedCount}`);

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
console.log('Updated reviews_with_keywords.xlsx');
