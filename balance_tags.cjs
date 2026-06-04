const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const categories = {
  '학습 계획 및 플래너': ['플래너', '계획', '스케줄', '커리큘럼', '방향', '시간표', '로드맵', '진도', '맞춤형', '학습관리', '입시관리', '인강'],
  '1:1 질의응답 및 상담': ['상담', '질문', '답변', '질의응답', '피드백', '조언', '1:1', '일대일'],
  '모의고사 및 성적 분석': ['모의고사', '평가원', '성적', '실전', '테스트', '약점', '리포트', '오답'],
  '출결 및 생활 루틴': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '규칙적', '생활관리'],
  '학습 환경 및 전자기기 통제': ['면학', '분위기', '소음', '정숙', '스마트폰', '휴대폰', '방화벽', '와이파이', '통제', '딴짓', '수거', '졸음', '깨워', '자습실', '환경', '기기'],
  '멘탈 케어 및 동기부여': ['버티는데', '의지', '위로', '응원', '챙겨', '멘탈', '마인드', '따뜻한', '격려', '포기', '안정', '슬럼프', '동기부여', '자신감', '할수있다', '버틸수']
};

let reviewsToProcess = data.filter(r => r.satisfaction > 50);

let reviewScores = reviewsToProcess.map(r => {
  const quoteText = (Array.isArray(r.summaryQuote) ? r.summaryQuote.join(' ') : r.summaryQuote || '').toLowerCase();
  const rawQuoteText = quoteText.replace(/\s+/g, '');
  const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
  const rawFullText = fullText.replace(/\s+/g, '');
  
  let scores = {};
  Object.keys(categories).forEach(cat => {
    let score = 0;
    categories[cat].forEach(k => {
      const rawK = k.replace(/\s+/g, '');
      // summary match gives +10
      if (rawQuoteText.includes(rawK)) score += 10;
      // full text match gives +1 per occurrence
      let count = (rawFullText.match(new RegExp(rawK, 'g')) || []).length;
      score += count;
    });
    scores[cat] = score;
  });
  
  let sortedCats = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    review: r,
    sortedCats: sortedCats, // [{cat: '상담', score: 15}, ...]
    maxScore: sortedCats[0][1],
    delta: sortedCats[0][1] - sortedCats[1][1]
  };
});

// Sort by delta descending so we process confident assignments first
reviewScores.sort((a, b) => b.delta - a.delta);

let distribution = {};
Object.keys(categories).forEach(c => distribution[c] = 0);

const TARGET_CAP = 65; // ~355 / 6 = 59. 65 is a soft cap to ensure even distribution

reviewScores.forEach(item => {
  let assigned = false;
  
  // Try to assign to best category that isn't full, provided score > 0
  for (let i = 0; i < item.sortedCats.length; i++) {
    let cat = item.sortedCats[i][0];
    let score = item.sortedCats[i][1];
    
    if (score === 0) break; // no match
    
    if (distribution[cat] < TARGET_CAP) {
      item.review.tags = [cat];
      distribution[cat]++;
      assigned = true;
      break;
    }
  }
  
  // If all matched categories are full, just assign to the absolute best one anyway
  if (!assigned && item.maxScore > 0) {
    let bestCat = item.sortedCats[0][0];
    item.review.tags = [bestCat];
    distribution[bestCat]++;
    assigned = true;
  }
  
  // If NO categories matched at all (score 0 for everything), force into the least full category
  if (!assigned) {
    let leastFullCat = Object.keys(distribution).sort((a,b) => distribution[a] - distribution[b])[0];
    item.review.tags = [leastFullCat];
    distribution[leastFullCat]++;
  }
});

// For reviews with satisfaction <= 50, clear their tags or give them dummy to avoid errors
data.forEach(r => {
  if (r.satisfaction <= 50) r.tags = [];
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

// Update Excel
const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(ws);

excelData.forEach(row => {
  let review = data.find(r => r.id === row.ID);
  if (review && review.tags) {
    row['핵심 키워드 (필터용)'] = review.tags.join(', ');
  } else {
    row['핵심 키워드 (필터용)'] = '';
  }
});

const newWs = xlsx.utils.json_to_sheet(excelData);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, excelFile);

console.log("Distribution:");
console.log(distribution);
