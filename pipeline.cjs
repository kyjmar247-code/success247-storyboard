const { execSync } = require('child_process');
const fs = require('fs');

console.log('Running extract.cjs...');
execSync('node extract.cjs', { stdio: 'inherit' });

console.log('Filtering for 2026...');
const file = './src/data/reviews.json';
let d = JSON.parse(fs.readFileSync(file, 'utf8'));
d = d.filter(r => r.graduationYear === 2026);
fs.writeFileSync(file, JSON.stringify(d, null, 2));

console.log('Running summarize.cjs...');
execSync('node summarize.cjs', { stdio: 'inherit' });

console.log('Applying text replacements...');
d = JSON.parse(fs.readFileSync(file, 'utf8'));
d.forEach(r => {
  let str = JSON.stringify(r);
  str = str.replace(/이투스 전국 모의고사/g, '실전 모의고사').replace(/전국 모의고사/g, '실전 모의고사');
  let obj = JSON.parse(str);
  
  let sq = Array.isArray(obj.summaryQuote) ? obj.summaryQuote.join(' ') : (obj.summaryQuote || '');
  
  if (sq.includes('이전년도들의 입시결과')) {
    sq = '입시 데이터를 바탕으로 제 상황에 가장 잘 맞는 대학을 추천해주셔서 큰 도움이 되었어요.';
  } else if (sq.includes('면학 분위기를 감독하는 것은')) {
    sq = '면학 분위기를 잘 관리, 감독 해주셔서 열심히 공부할 수 있었어요.';
  } else if (sq.includes('졸음도 아예 못자는게 아니라')) {
    sq = '무조건 졸음을 참는 것이 아니라, 필요할 때 잠깐 쉬고 다시 집중할 수 있어서 좋았어요.';
  }

  // Remove transition words at the start of the sentence
  sq = sq.replace(/^(또한|특히|그리고|그래서|하지만|게다가|그러므로|그 외에도|무엇보다도|무엇보다|단연코|가장)[,\s]+/, '');

  obj.summaryQuote = sq;
  
  Object.assign(r, obj);
});

fs.writeFileSync(file, JSON.stringify(d, null, 2));
console.log('Pipeline complete, reviews count: ' + d.length);
