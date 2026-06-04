const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const strictMap = {
  '학습·입시 관리': ['학습입시관리', '학습관리', '학습상담', '입시관리', '입시상담', '인강추천', '이투스구독'],
  '학습 계획': ['학습계획', '매리트'],
  '플래너 관리': ['플래너관리', '플래너'],
  '상담': ['상담', '질의응답'],
  '출결·생활 습관': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '생활관리', '생활상담'],
  '스마트폰·방화벽': ['휴대폰', '스마트폰', '핸드폰수거', '방화벽', '전자출결', '와이파이'],
  '면학 분위기': ['면학분위기'],
  '졸음 관리': ['졸음관리', '졸음'],
  '모의고사': ['모의고사'],
  '학원 생활': ['버티는데', '버틸수', '의지', '위로', '응원', '챙겨', '재수생활', '수험생활', '멘탈', '마인드', '따뜻한', '격려', '힘들때', '힘들었는데', '포기하고', '안정', '슬럼프', '따스한', '친근', '신경써주셔서']
};

const titleToTags = {
  '학습 상담': '학습·입시 관리', '입시 상담': '학습·입시 관리', '성적 리포팅 및 관리': '학습·입시 관리', '이투스 구독': '학습·입시 관리', '인강 교재 추천 및 수강 관리': '학습·입시 관리', '학습 성향 및 성취도 진단(LMTI)': '학습·입시 관리',
  '학습 계획, 플래너 관리': ['학습 계획', '플래너 관리'], '1:1 질의 응답': '상담', '태블릿 모니터링 시스템/와이파이 방화벽': '스마트폰·방화벽', '생활 상담': '출결·생활 습관', '전자 출결 관리': '출결·생활 습관', '출석 시 핸드폰 수거': '스마트폰·방화벽', '면학 분위기 감독   졸음 관리': ['면학 분위기', '졸음 관리'], '이투스 전국 모의고사': '모의고사'
};

const semanticMap = {
  '학습·입시 관리': ['진도', '성적향상', '전략', '컨설팅', '코칭', '방향', '맞춤형'],
  '학습 계획': ['계획', '스케줄', '시간표', '학습량', '커리큘럼', '로드맵'],
  '플래너 관리': ['플래너'],
  '상담': ['질문', '답변', '질의응답', '조언', '피드백', '멘탈'],
  '출결·생활 습관': ['출결', '출석', '지각', '생활패턴', '생활습관', '생활루틴', '규칙적'],
  '스마트폰·방화벽': ['휴대폰', '스마트폰', '방화벽', '와이파이', '전자기기', '딴짓', '수거', '매너타임'],
  '면학 분위기': ['면학', '소음', '정숙', '자습실분위기', '학습분위기', '떠드는', '조용한'],
  '졸음 관리': ['졸음', '깨워', '수면'],
  '모의고사': ['평가원', '실전감각', '모의고사', '데일리테스트', '영단어테스트'],
  '학원 생활': ['버티는데', '버틸수', '의지', '위로', '응원', '챙겨', '재수생활', '수험생활', '멘탈', '마인드', '따뜻한', '격려', '힘들때', '힘들었는데', '포기하고', '안정', '슬럼프', '따스한', '친근', '신경써주셔서']
};

function getScore(tag, r, rawQuoteText, rawFullText) {
  let score = 0;
  if (strictMap[tag] && strictMap[tag].some(k => rawQuoteText.includes(k))) score += 100;
  
  const titles = [r.coachingTitle, r.learningTitle, r.lifeTitle, r.contentTitle].filter(Boolean);
  let matchedTitle = false;
  titles.forEach(title => {
    const mapped = titleToTags[title];
    if (mapped === tag || (Array.isArray(mapped) && mapped.includes(tag))) matchedTitle = true;
  });
  if (matchedTitle) score += 50;
  
  if (semanticMap[tag]) {
    semanticMap[tag].forEach(k => {
      let count = (rawFullText.match(new RegExp(k, 'g')) || []).length;
      score += count;
    });
  }
  return score;
}

let singleCount = 0;
let tiedCount = 0;

data.forEach(r => {
  if (!r.tags || r.tags.length <= 1) {
    if (r.tags && r.tags.length === 1) singleCount++;
    return;
  }
  
  const quoteText = (Array.isArray(r.summaryQuote) ? r.summaryQuote.join(' ') : r.summaryQuote || '').toLowerCase();
  const rawQuoteText = quoteText.replace(/\s+/g, '');
  const fullText = ((r.coachingReview||'') + ' ' + (r.learningReview||'') + ' ' + (r.lifeReview||'') + ' ' + (r.contentReview||'') + ' ' + quoteText).toLowerCase();
  const rawFullText = fullText.replace(/\s+/g, '');

  let scores = [];
  r.tags.forEach(tag => {
    scores.push({ tag, score: getScore(tag, r, rawQuoteText, rawFullText) });
  });

  scores.sort((a, b) => b.score - a.score);
  
  if (scores.length > 1 && scores[0].score === scores[1].score) {
    const topScore = scores[0].score;
    r.tags = scores.filter(s => s.score === topScore).map(s => s.tag);
    tiedCount++;
  } else {
    r.tags = [scores[0].tag];
    singleCount++;
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

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
console.log(`Successfully reduced to 1 tag: ${singleCount} reviews total.`);
console.log(`Left with ties (needs manual review): ${tiedCount} reviews.`);
