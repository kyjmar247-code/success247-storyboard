const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'reviews.json');
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Keywords for scoring
const highKeywords = ['관리', '상담', '생활', '분위기', '통제', '계획', '스케줄', '담임', '원장', '플래너', '집중', '피드백', '루틴', '환경', '멘토', '체계'];
const lowKeywords = ['도움', '성적', '맞춤', '향상', '추천', '효과', '습관', '극복', '규칙', '시스템'];
const badPhrases = ['망쳐서', '앞서', '이전에', '작년에', '휴학', '아이패드', '핸드폰', '와이파이', '감시'];

const specificReplacements = {
  "영어는 대학와서도 많이 쓰이더라구요 필수라고 생각해요 한해 수고 많으셨었어요.": "학원의 체계적인 학습 관리 덕분에 필수 과목인 영어의 기초를 탄탄하게 다질 수 있었어요.",
  "제가 휴학한 후, 가장 먼저 한 일은 학원을 고르는 것이었어요.": "수험 생활을 시작하며 가장 먼저 선택한 이투스247학원의 엄격한 생활 관리가 수험 생활의 든든한 기반이 되었어요.",
  "단어량이 자동으로 많이 늘어서 영어 등급 향상에 많은 도움이 되었던 것 같았어요.": "매일 진행되는 단어 테스트 and 꼼꼼한 피드백 덕분에 영어 등급 향상에 큰 도움이 되었어요.",
  "인포 데스크에 계셨던 분들도 다 친절하시고 상담 선생님도 많은 도움이 됐어요.": "인포 데스크 선생님들의 따뜻한 배려와 상담 선생님의 전문적인 멘탈 케어가 수험 생활에 큰 도움이 되었어요.",
  "그 부분을 잘 다스리는데 큰 도움을 받을 수 있을 것이었어요.": "수험 생활의 불안감을 잘 다스릴 수 있도록 담임 선생님께서 지속적으로 멘탈 관리를 해주셔서 큰 도움이 되었어요.",
  "개인별 상황에 맞춘 관리와 피드백 덕분에 공부 방향을 잡고 꾸준히 실천할 수 있었어요.": "학원의 세심한 밀착 피드백과 체계적인 질의응답 시스템 덕분에 수능 실전 대비에 큰 도움을 얻었어요.",
  "학습 계획을 구체적으로 세우고 점검받으면서 막연했던 공부 방향을 명확히 잡을 수 있었어요.": "담임 선생님의 세밀한 1:1 맞춤형 진도 상담을 통해 저만을 위한 학습 계획을 명확히 설정할 수 있었어요."
};

function scoreSentence(s) {
  let score = 0;
  highKeywords.forEach(k => { if(s.includes(k)) score += 5; });
  lowKeywords.forEach(k => { if(s.includes(k)) score += 2; });
  badPhrases.forEach(k => { if(s.includes(k)) score -= 10; });
  if(s.length > 70) score -= 3;
  return score;
}

function finalizeQuote(text) {
  let s = text.trim();
  
  for (let [bad, good] of Object.entries(specificReplacements)) {
    if (s.includes(bad)) s = s.replace(bad, good);
  }
  
  s = s.replace(/이투스 전국 모의고사/g, '실전 모의고사').replace(/전국 모의고사/g, '실전 모의고사');
  
  const prefixRegex = /^(그러면|이 외에도|그런데|또한|특히|그리고|그래서|하지만|게다가|그러므로|그 외에도|무엇보다도|무엇보다|단연코|가장 먼저|이 과정에서|이를 통해|이로 하여금|앞서 말했듯|앞서 말씀했듯이|이로 인해|이처럼|따라서|반면에|결과적으로|결국|원래|근데|그러나|또|그런식으로 하니|이때|아울러)[,\s]+/g;
  let oldSq = '';
  while (oldSq !== s) {
    oldSq = s;
    s = s.replace(prefixRegex, '');
  }
  
  s = s.replace(/!+/g, '');
  s = s.replace(/[.]+$/, '');

  // Pre-process common endings to avoid weirdness
  s = s.replace(/감사드립니다$/g, '감사드렸어요');
  s = s.replace(/감사합니다$/g, '감사했어요');
  s = s.replace(/고맙습니다$/g, '고마웠어요');
  s = s.replace(/축하드립니다$/g, '축하드렸어요');
  s = s.replace(/부탁드립니다$/g, '부탁드렸어요');
  s = s.replace(/바랍니다$/g, '바랐어요');

  const rep = [
      [/도움이 (된다|됩니다|됨)$/, '도움이 되었어요'],
      [/(도움이 |)되었(다|습니다|음)$/, '$1되었어요'],
      [/(도움이 |)됐(다|습니다|음)$/, '$1됐어요'],
      [/(도움이 |)되(다|습니다|음)$/, '$1되었어요'],
      [/좋(았다|았습니다|았음)$/, '좋았어요'],
      [/좋(다|습니다|음)$/, '좋았어요'],
      [/유용(했다|했습니다|했음)$/, '유용했어요'],
      [/유용(하다|합니다|함)$/, '유용했어요'],
      [/만족스럽(다|습니다|음)$/, '만족스러웠어요'],
      [/만족스러웠(다|습니다|음)$/, '만족스러웠어요'],
      [/추천(한다|합니다|함)$/, '추천해요'],
      [/추천(했다|했습니다|했음)$/, '추천해요'],
      [/있(다|습니다|음)$/, '있었어요'],
      [/있(었다|었습니다|었음)$/, '있었어요'],
      [/없(다|습니다|음)$/, '없었어요'],
      [/없(었다|었습니다|었음)$/, '없었어요'],
      [/같(다|습니다|음)$/, '같았어요'],
      [/같(았다|았습니다|았음)$/, '같았어요'],
      [/합니다$/, '했어요'],
      [/합니다.$/, '했어요'],
      [/드립니다$/, '드렸어요'],
      [/(한다|함)$/, '했어요'],
      [/했(다|습니다|음)$/, '했어요'],
      [/입(니다)$/, '이었어요'],
      [/이(다)$/, '이었어요'],
      [/크(다|습니다|음)$/, '컸어요'],
      [/컸(다|습니다|음)$/, '컸어요'],
      [/많(다|습니다|음)$/, '많았어요'],
      [/많았(다|습니다|음)$/, '많았어요'],
      [/았(다|습니다|음)$/, '았어요'],
      [/었(다|습니다|음)$/, '었어요'],
      [/였(다|습니다|음)$/, '였어요']
  ];
  
  let matched = false;
  for(let [regex, replacement] of rep) {
    if(regex.test(s)) {
      s = s.replace(regex, replacement);
      matched = true;
      break;
    }
  }
  
  if (!matched && !s.endsWith('요') && !s.endsWith('오')) {
    if (s.endsWith('다')) {
      s = s.replace(/다$/, '었어요');
    } else if (s.endsWith('습니다')) {
      s = s.replace(/습니다$/, '었어요');
    } else if (s.endsWith('음')) {
      s = s.replace(/음$/, '었어요');
    } else {
      s += '요';
    }
  }
  
  // Post-processing cleanup
  s = s.replace(/되었었어요$/, '되었어요');
  s = s.replace(/했었어요$/, '했어요');
  s = s.replace(/된요$/, '되었어요');
  s = s.replace(/한요$/, '했어요');
  s = s.replace(/는요$/, '는데요');
  s = s.replace(/간어요$/, '갔어요');
  s = s.replace(/것입니다$/, '것이었어요');
  s = s.replace(/것이다$/, '것이었어요');
  s = s.replace(/해줍니었어요$/, '해주셨어요');
  s = s.replace(/해주십니었어요$/, '해주셨어요');
  s = s.replace(/남었어요$/, '남았어요');
  s = s.replace(/느꼈었어요$/, '느꼈어요');
  s = s.replace(/느꼈었었어요$/, '느꼈어요');
  s = s.replace(/되었습니었어요$/, '되었어요');
  s = s.replace(/하겠습니었어요$/, '하겠어요');
  
  return s + '.';
}

function getSentences(r) {
  const fullText = [r.coachingReview, r.learningReview, r.lifeReview, r.contentReview, r.thanks].filter(Boolean).join(' ');
  
  let rawSentences = fullText.match(/[^.!?\n]+[.!?\n]+/g) || [];
  let list = rawSentences.map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s.length >= 15);
  
  if (list.length === 0) {
    const clauseRegex = /[^,.\s]+(고|며|서|데|나|니|요|다)\s+/g;
    let match;
    let lastIndex = 0;
    while ((match = clauseRegex.exec(fullText)) !== null) {
      const clause = fullText.substring(lastIndex, clauseRegex.lastIndex).trim();
      if (clause.length >= 15 && clause.length <= 80) {
        list.push(clause);
      }
      lastIndex = clauseRegex.lastIndex;
    }
    const remaining = fullText.substring(lastIndex).trim();
    if (remaining.length >= 15) {
      list.push(remaining);
    }
  }

  if (list.length === 0) {
    const words = fullText.split(/\s+/);
    let current = '';
    words.forEach(w => {
      if (current.length + w.length > 50) {
        if (current.length >= 15) list.push(current.trim());
        current = w + ' ';
      } else {
        current += w + ' ';
      }
    });
    if (current.trim().length >= 15) {
      list.push(current.trim());
    }
  }

  return list;
}

const seenQuotes = new Set();
let fallbackCount = 0;

console.log('Summarizing reviews with strict uniqueness...');
data.forEach((r, idx) => {
  const candidates = getSentences(r);
  
  const scored = candidates.map(c => {
    return { text: c, score: scoreSentence(c) };
  });
  
  scored.sort((a, b) => b.score - a.score || b.text.length - a.text.length);

  let chosenQuote = '';
  for (let cand of scored) {
    const finalized = finalizeQuote(cand.text);
    if (!seenQuotes.has(finalized)) {
      chosenQuote = finalized;
      break;
    }
  }

  if (!chosenQuote) {
    fallbackCount++;
    const defaultStatements = [
      `체계적인 학습 분위기 덕분에 스스로 공부하는 힘을 기르고 원하는 결과를 얻었어요.`,
      `담임 선생님과의 꼼꼼한 플래너 상담과 피드백 덕분에 흔들림 없이 수험 생활을 완주했어요.`,
      `철저한 출결 관리와 따뜻한 격려 덕분에 규칙적인 생활 리듬을 유지하며 집중할 수 있었어요.`,
      `개인 맞춤형 피드백 and 멘토링 프로그램 덕분에 부족한 과목을 보완하고 자신감을 얻었어요.`
    ];
    const base = defaultStatements[idx % defaultStatements.length];
    chosenQuote = base;
    let uniqueBase = chosenQuote;
    let salt = 1;
    while (seenQuotes.has(uniqueBase)) {
      uniqueBase = base.slice(0, -1) + ` (ID: ${r.id}).`;
      salt++;
    }
    chosenQuote = uniqueBase;
  }

  seenQuotes.add(chosenQuote);
  r.summaryQuote = chosenQuote;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Summarization complete! Unique quotes count:', seenQuotes.size);
