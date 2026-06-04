const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const categories = {
  '학습 계획 및 관리': ['플래너', '계획', '스케줄', '커리큘럼', '방향', '시간표', '로드맵', '진도', '맞춤형', '학습관리', '입시관리', '인강'],
  '1:1 질의응답 및 상담': ['상담', '질문', '답변', '질의응답', '피드백', '조언', '1:1', '일대일'],
  '모의고사 및 성적 분석': ['모의고사', '평가원', '성적', '실전', '테스트', '약점', '리포트', '오답'],
  '학습 환경 및 전자기기 통제': ['면학', '분위기', '소음', '정숙', '스마트폰', '휴대폰', '방화벽', '와이파이', '통제', '딴짓', '수거', '졸음', '깨워', '자습실', '환경', '기기'],
  '동기부여 및 생활 관리': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '규칙적', '생활관리', '버티는데', '의지', '위로', '응원', '챙겨', '멘탈', '마인드', '따뜻한', '격려', '포기', '안정', '슬럼프', '동기부여', '자신감', '할수있다', '버틸수'],
  '담임 선생님': ['담임', '선생님', '원장님', '원장', '선생', '밀착', '케어']
};

let distribution = {};
Object.keys(categories).forEach(c => distribution[c] = 0);
let unclassified = 0;

data.forEach(r => {
  if (r.satisfaction <= 50) {
    r.tags = [];
    return;
  }
  
  const quoteText = (Array.isArray(r.summaryQuote) ? r.summaryQuote.join(' ') : r.summaryQuote || '').toLowerCase().replace(/\s+/g, '');
  
  // Hard Priority Rule: If '상담' is present, force '1:1 질의응답 및 상담'
  if (quoteText.includes('상담')) {
    r.tags = ['1:1 질의응답 및 상담'];
    distribution['1:1 질의응답 및 상담']++;
    return;
  }
  
  let scores = {};
  Object.keys(categories).forEach(cat => {
    let score = 0;
    categories[cat].forEach(k => {
      const rawK = k.replace(/\s+/g, '');
      let count = (quoteText.match(new RegExp(rawK, 'g')) || []).length;
      score += count;
    });
    if (score > 0) scores[cat] = score;
  });
  
  let sortedCats = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  if (sortedCats.length > 0) {
    // Pick the top one
    let bestCat = sortedCats[0][0];
    r.tags = [bestCat];
    distribution[bestCat]++;
  } else {
    r.tags = [];
    unclassified++;
  }
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

console.log("Distribution after adding teacher & consultation priority:");
console.log(distribution);
console.log("Unclassified:", unclassified);
