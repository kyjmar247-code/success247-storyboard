const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src', 'data', 'reviews.json');
let reviews = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Keywords that indicate a good summary sentence
const keywords = ['도움', '성적', '피드백', '맞춤', '향상', '집중', '추천', '루틴', '관리', '분위기', '효과', '습관', '상담', '계획', '극복', '체계적'];

function scoreSentence(sentence) {
  let score = 0;
  for (const kw of keywords) {
    if (sentence.includes(kw)) score += 1;
  }
  return score;
}

function splitIntoThreeLines(sentence) {
  const words = sentence.split(' ');
  const lines = ['', '', ''];
  let currentLine = 0;
  
  // Try to distribute words evenly based on total length
  const targetLen = sentence.length / 3;
  
  for (const word of words) {
    if (currentLine < 2 && lines[currentLine].length >= targetLen * 0.8) {
      currentLine++;
    }
    lines[currentLine] += (lines[currentLine] ? ' ' : '') + word;
  }
  
  return lines.filter(Boolean);
}

for (let r of reviews) {
  // Combine all texts
  const fullText = [
    r.coachingReview, r.learningReview, r.lifeReview, r.contentReview, r.thanks
  ].filter(Boolean).join(' ');

  // Split into sentences using punctuation
  const rawSentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
  
  // Clean sentences
  const sentences = rawSentences.map(s => s.trim().replace(/\s+/g, ' '));
  
  // Filter for reasonable length (25 to 65 chars is ideal for 3 lines of ~15 chars)
  let validSentences = sentences.filter(s => s.length >= 25 && s.length <= 65);
  
  if (validSentences.length === 0) {
    // If no sentence fits perfectly, take the closest one
    validSentences = sentences.filter(s => s.length > 15);
  }
  
  if (validSentences.length === 0) {
    validSentences = [fullText.substring(0, 50) + '...']; // Fallback
  }

  // Score them
  validSentences.sort((a, b) => scoreSentence(b) - scoreSentence(a));
  
  let bestSentence = validSentences[0];
  
  // If it's still way too long
  if (bestSentence.length > 70) {
     const clauseMatch = bestSentence.match(/.*?([가-힣]+(고|서|지만|는데))\s/);
     if (clauseMatch && clauseMatch[0].length >= 30) {
         bestSentence = clauseMatch[0].trim() + " 도움이 되었습니다.";
     } else {
         bestSentence = bestSentence.substring(0, 45).trim() + " 큰 도움이 되었습니다.";
     }
  }

  // Convert tone to "~요." and remove exclamation marks
  function convertTone(text) {
    let s = text.replace(/!+/g, '');
    s = s.trim().replace(/[.]+$/, '');
    
    // Explicit dictionary for safety (Force past tense)
    const replacements = [
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
      
      [/추천(한다|합니다|함)$/, '추천했어요'],
      [/추천(했다|했습니다|했음)$/, '추천했어요'],
      
      [/있(다|습니다|음)$/, '있었어요'],
      [/있(었다|었습니다|었음)$/, '있었어요'],
      
      [/없(다|습니다|음)$/, '없었어요'],
      [/없(었다|었습니다|었음)$/, '없었어요'],
      
      [/같(다|습니다|음)$/, '같았어요'],
      [/같(았다|았습니다|았음)$/, '같았어요'],
      
      [/(한다|합니다|함)$/, '했어요'],
      [/했(다|습니다|음)$/, '했어요'],
      
      [/입(니다)$/, '이었어요'],
      [/이(다)$/, '이었어요'],
      
      [/크(다|습니다|음)$/, '컸어요'],
      [/컸(다|습니다|음)$/, '컸어요'],
      
      [/많(다|습니다|음)$/, '많았어요'],
      [/많았(다|습니다|음)$/, '많았어요'],
      
      // Catch all past tense
      [/았(다|습니다|음)$/, '았어요'],
      [/었(다|습니다|음)$/, '었어요'],
      [/였(다|습니다|음)$/, '였어요']
    ];

    let matched = false;
    for (let [regex, replacement] of replacements) {
      if (regex.test(s)) {
        s = s.replace(regex, replacement);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
        if (s.endsWith('다') || s.endsWith('음') || s.endsWith('습니다')) {
            s = s.replace(/(다|음|습니다)$/, '었어요');
        } else if (!s.endsWith('요') && !s.endsWith('오')) {
            s += '요';
        }
    }
    
    // Cleanup any weirdness
    s = s.replace(/된요$/, '되었어요');
    s = s.replace(/한요$/, '했어요');
    s = s.replace(/는요$/, '는데요');
    s = s.replace(/간어요$/, '갔어요');
    s = s.replace(/것입니다$/, '것이었어요');
    s = s.replace(/것이다$/, '것이었어요');

    return s + '.';
  }

  bestSentence = convertTone(bestSentence);

  r.summaryQuote = splitIntoThreeLines(bestSentence);
}

fs.writeFileSync(dataPath, JSON.stringify(reviews, null, 2));
console.log('Summarization complete! Processed', reviews.length, 'reviews.');
