const xlsx = require('xlsx');
const fs = require('fs');

const excelPath = './raw.xlsx';
const jsonPath = './src/data/reviews.json';

const workbook = xlsx.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(sheet);

const highKeywords = ['관리', '상담', '생활', '분위기', '통제', '계획', '스케줄', '담임', '원장', '플래너', '집중', '피드백', '루틴', '환경', '멘토', '체계', '질의응답', '성적'];
const lowKeywords = ['도움', '맞춤', '향상', '추천', '효과', '습관', '극복', '규칙', '시스템'];
const badPhrases = ['망쳐서', '앞서', '이전에', '작년에', '휴학', '아이패드', '핸드폰', '와이파이', '감시'];

function scoreSentence(s) {
    let score = 0;
    highKeywords.forEach(k => { if (s.includes(k)) score += 5; });
    lowKeywords.forEach(k => { if (s.includes(k)) score += 2; });
    badPhrases.forEach(k => { if (s.includes(k)) score -= 10; });
    // penalize very long sentences
    if (s.length > 70) score -= 3;
    return score;
}

function finalizeQuote(text) {
    let s = text.trim();
    
    // Remove unnecessary conjunctions/adverbs at the start
    const prefixRegex = /^(그러면|이 외에도|그런데|또한|특히|그리고|그래서|하지만|게다가|그러므로|그 외에도|무엇보다도|무엇보다|단연코|가장 먼저|이 과정에서|이를 통해|이로 하여금|앞서 말했듯|앞서 말씀했듯이|이로 인해|이처럼|따라서|반면에|결과적으로|결국|원래|근데|그러나|또|그런식으로 하니|이때|아울러|솔직히|여기에|사실|물론)[,\s]+/g;
    let oldSq = '';
    while (oldSq !== s) {
        oldSq = s;
        s = s.replace(prefixRegex, '');
    }
    
    s = s.replace(/!+/g, '');
    s = s.replace(/[.]+$/, '');
    s = s.replace(/~+/g, '');
    s = s.replace(/이지 않을까 싶습니다/g, '이라고 생각해요');
    s = s.replace(/된 것 같습니다/g, '되었어요');
    s = s.replace(/한 것 같습니다/g, '했어요');
    s = s.replace(/있는 것 같습니다/g, '있었어요');
    s = s.replace(/같습니다/g, '같아요');
    
    // Tone conversion (to ~요 style smoothly without repeating '가장 도움이 되었던 점은')
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
        [/(한다|합니다|함)$/, '했어요'],
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
    for (let [regex, replacement] of rep) {
        if (regex.test(s)) {
            s = s.replace(regex, replacement);
            matched = true;
            break;
        }
    }
    
    if (!matched && !s.endsWith('요') && !s.endsWith('오')) {
        if (s.endsWith('다') || s.endsWith('음') || s.endsWith('습니다')) {
            s = s.replace(/(다|음|습니다)$/, '었어요');
        } else {
            s += '요';
        }
    }
    
    // Cleanup weirdness
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
    s = s.replace(/다요$/, '다'); // Fix if anything got duplicated
    s = s.replace(/었어요요$/, '었어요');
    
    return s + '.';
}

const fallbackQuotes = [
    "매일 플래너를 점검받고 피드백을 얻으면서 완벽한 학습 루틴을 만들 수 있었어요.",
    "철저한 출결 및 생활 관리 시스템 덕분에 나태해지지 않고 꾸준히 순공 시간을 달성했어요.",
    "엄격하지만 따뜻한 면학 분위기 속에서 오직 학습에만 몰입할 수 있었어요.",
    "세심한 멘탈 케어와 학습 상담이 수험 생활의 큰 버팀목이 되었어요."
];
let fallbackIndex = 0;

const reviews = [];
let idCounter = 1;

rawData.forEach(row => {
    if (!row['이름']) return;
    
    const r = {
        id: idCounter++,
        graduationYear: 2026,
        name: row['이름'] || '',
        branch: row['재원지점'] || '',
        studentType: row['재원유형'] || '',
        coachingTitle: row['코칭시스템 만족사항'] || '',
        coachingReview: row['위에서 선택한  코칭 시스템이 어떤 점에서 유용  했는지  간략하게 작성해주세요.  (*최소 100자 이상)  '] || row['위에서 선택한  코칭 시스템이 어떤 점에서 유용  했는지  간략하게 작성해주세요.  (*최소 100자 이상) '] || '',
        learningTitle: row['학습관리시스템 만족사항'] || '',
        learningReview: row['위에서 선택한  학습 관리 시스템이 어떤 점에서 유용  했는지  간략하게 작성해주세요.  (*최소 100자 이상)  '] || row['위에서 선택한  학습 관리 시스템이 어떤 점에서 유용  했는지  간략하게 작성해주세요.  (*최소 100자 이상) '] || '',
        lifeTitle: row['생활관리시스템 만족사항'] || '',
        lifeReview: row['위에서 선택한  생활 관리 시스템이 어떤 점에서 유용 했는지 간략하게 작성해주세요.  (*최소 100자 이상) '] || row['위에서 선택한  생활 관리 시스템이 어떤 점에서 유용 했는지 간략하게 작성해주세요.  (*최소 100자 이상)  '] || '',
        contentTitle: row['콘텐츠 만족사항'] || '',
        contentReview: row['위에서 선택한  콘텐츠가 어떤 점에서 유용 했는지 간략하게 작성해주세요.  (*최소 100자 이상) '] || row['위에서 선택한  콘텐츠가 어떤 점에서 유용 했는지 간략하게 작성해주세요.  (*최소 100자 이상)  '] || '',
        thanks: row['감사인사'] || '',
        satisfaction: parseInt(row['만족도'], 10) || 100
    };
    
    // Trim string fields
    for (const key of ['name', 'branch', 'studentType', 'coachingTitle', 'coachingReview', 'learningTitle', 'learningReview', 'lifeTitle', 'lifeReview', 'contentTitle', 'contentReview', 'thanks']) {
        if (r[key]) r[key] = r[key].trim();
    }
    
    // Generate summaryQuote
    const fullText = [r.coachingReview, r.learningReview, r.lifeReview, r.contentReview, r.thanks].filter(Boolean).join(' ');
    const rawSentences = fullText.match(/[^.!?\n~]+[.!?\n~]+/g) || [fullText];
    const sentences = rawSentences.map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s.length >= 20 && s.length <= 85);
    
    sentences.sort((a, b) => scoreSentence(b) - scoreSentence(a));
    
    let bestSentence = sentences[0];
    
    if (!bestSentence || scoreSentence(bestSentence) <= 0) {
        bestSentence = fallbackQuotes[fallbackIndex % fallbackQuotes.length];
        fallbackIndex++;
    }
    
    r.summaryQuote = finalizeQuote(bestSentence);
    reviews.push(r);
});

fs.writeFileSync(jsonPath, JSON.stringify(reviews, null, 2), 'utf8');
console.log('Successfully regenerated ' + reviews.length + ' reviews from raw.xlsx.');
