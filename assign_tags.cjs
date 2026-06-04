const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let reviews = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const titleToTags = {
  '학습 상담': ['학습·입시 관리'],
  '입시 상담': ['학습·입시 관리'],
  '성적 리포팅 및 관리': ['학습·입시 관리'],
  '이투스 구독': ['학습·입시 관리'],
  '인강 교재 추천 및 수강 관리': ['학습·입시 관리'],
  '학습 성향 및 성취도 진단(LMTI)': ['학습·입시 관리'],
  '매리트(일일테스트)': ['학습·입시 관리'],
  'VOCA 테스트': ['학습·입시 관리'],
  '학습 계획, 플래너 관리': ['학습 계획', '플래너 관리'],
  '1:1 질의 응답': ['질의응답'],
  '태블릿 모니터링 시스템/와이파이 방화벽': ['생활 관리'],
  '생활 상담': ['생활 관리'],
  '전자 출결 관리': ['생활 관리'],
  '출석 시 핸드폰 수거': ['생활 관리'],
  '면학 분위기 감독   졸음 관리': ['면학 분위기', '졸음 관리'],
  '이투스 전국 모의고사': ['모의고사']
};

reviews.forEach(r => {
  let tagsSet = new Set();
  
  [r.coachingTitle, r.learningTitle, r.lifeTitle, r.contentTitle].forEach(title => {
    if (title && titleToTags[title]) {
      titleToTags[title].forEach(t => tagsSet.add(t));
    }
  });

  r.tags = Array.from(tagsSet);
});

fs.writeFileSync(jsonFile, JSON.stringify(reviews, null, 2));
console.log('Updated reviews.json');

// Now update Excel
const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

data.forEach(row => {
  let review = reviews.find(r => r.id === row.ID);
  if (review) {
    row['핵심 키워드 (필터용)'] = review.tags.join(', ');
  }
});

const newWs = xlsx.utils.json_to_sheet(data);
wb.Sheets[wb.SheetNames[0]] = newWs;
xlsx.writeFile(wb, excelFile);
console.log('Updated reviews_with_keywords.xlsx');
