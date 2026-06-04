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
  '출결·생활 습관': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '생활관리', '생활상담'],
  '스마트폰·방화벽': ['휴대폰', '스마트폰', '핸드폰수거', '방화벽', '전자출결', '와이파이'],
  '면학 분위기': ['면학분위기'],
  '졸음 관리': ['졸음관리', '졸음'],
  '모의고사': ['모의고사']
};

// Refined Semantic map for full text
const semanticMap = {
  '학습·입시 관리': ['진도', '성적향상', '전략', '컨설팅', '코칭', '방향', '맞춤형'],
  '학습 계획': ['계획', '스케줄', '시간표', '학습량', '커리큘럼', '로드맵'],
  '플래너 관리': ['플래너'],
  '상담': ['질문', '답변', '질의응답', '조언', '피드백', '멘탈'],
  '출결·생활 습관': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '규칙적'],
  '스마트폰·방화벽': ['휴대폰', '스마트폰', '방화벽', '와이파이', '전자기기', '딴짓', '수거', '매너타임'],
  '면학 분위기': ['면학', '소음', '정숙', '자습실분위기', '학습분위기', '떠드는', '조용한'],
  '졸음 관리': ['졸음', '깨워', '수면'],
  '모의고사': ['평가원', '실전감각', '모의고사', '데일리테스트', '영단어테스트']
};

let uncategorizedCount = 0;
let recategorizedCount = 0;

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
    uncategorizedCount++;
    const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
    const rawFullText = fullText.replace(/\s+/g, '');
    
    for (const [tag, keywords] of Object.entries(semanticMap)) {
      if (keywords.some(k => rawFullText.includes(k.replace(/\s+/g, '')))) {
        matchedTags.add(tag);
      }
    }
    if (matchedTags.size > 0) recategorizedCount++;
  }

  // Enforce attendance rule for ALL reviews (as requested by user previously)
  const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
  if (fullText.includes('출결') || fullText.includes('출석')) {
    matchedTags.add('출결·생활 습관');
  }

  r.tags = Array.from(matchedTags);
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
console.log(`Uncategorized before semantic: ${uncategorizedCount}, Recategorized: ${recategorizedCount}`);
console.log('Retagging complete.');
