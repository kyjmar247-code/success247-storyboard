const fs = require('fs'); 
const data = JSON.parse(fs.readFileSync('./src/data/reviews.json', 'utf8')); 
const cats = ['학습 계획 및 플래너', '1:1 질의응답 및 상담', '학습 환경 및 전자기기 통제', '모의고사 및 성적 분석', '동기부여 및 생활 관리']; 

let report = '# 🔍 핵심 키워드별 매칭 검수 리포트\n\n';
report += '오직 **요약 문구(summaryQuote)**에 포함된 단어만을 기준으로 매칭된 결과 중 카테고리별로 랜덤하게 3개씩 추출하여 검수한 결과입니다.\n\n';

cats.forEach(c => { 
  const subset = data.filter(r => r.tags && r.tags.includes(c)); 
  report += `## 🔹 ${c} (총 ${subset.length}개)\n`; 
  
  let samples = []; 
  let tempSubset = [...subset];
  for(let i=0; i<3; i++) { 
    if(tempSubset.length > 0) { 
      let idx = Math.floor(Math.random() * tempSubset.length); 
      samples.push(tempSubset[idx]); 
      tempSubset.splice(idx, 1); 
    } 
  } 
  
  samples.forEach((s) => { 
    const sq = Array.isArray(s.summaryQuote) ? s.summaryQuote.join(' ') : s.summaryQuote; 
    report += `* **[ID ${s.id}]** "${sq}"\n`; 
  }); 
  report += '\n'; 
}); 

const unclassified = data.filter(r => r.satisfaction > 50 && (!r.tags || r.tags.length === 0));
report += `## 🔸 미분류 (총 ${unclassified.length}개)\n`;
report += `어떤 카테고리 단어도 요약 문구에 포함되지 않은 후기들입니다.\n`;
let tempUnclass = [...unclassified];
for(let i=0; i<3; i++) { 
  if(tempUnclass.length > 0) { 
    let idx = Math.floor(Math.random() * tempUnclass.length); 
    const s = tempUnclass[idx];
    const sq = Array.isArray(s.summaryQuote) ? s.summaryQuote.join(' ') : s.summaryQuote; 
    report += `* **[ID ${s.id}]** "${sq}"\n`; 
    tempUnclass.splice(idx, 1); 
  } 
} 

fs.writeFileSync('C:/Users/KYJ/.gemini/antigravity/brain/bf8b0341-b154-4e93-99dc-2485477830fb/keyword_inspection_report.md', report); 
console.log('Report generated.');
