const fs = require('fs');
const iconv = require('iconv-lite');
const { parse } = require('csv-parse/sync');

const csvPath = './reviews_export.csv';
const jsonPath = './src/data/reviews.json';

const buf = fs.readFileSync(csvPath);

// Decode buffer (Try EUC-KR first for Korean Excel default)
let content = iconv.decode(buf, 'euc-kr');
// If EUC-KR decoding yields weird replacement chars for Korean text, it might be UTF8
if (content.includes('')) {
    content = iconv.decode(buf, 'utf8');
}

if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}

try {
    const records = parse(content, {
        columns: false,
        skip_empty_lines: true
    });

    const reviews = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const idMap = new Map();
    records.slice(1).forEach(row => {
        if (row.length >= 5 && row[0]) {
            idMap.set(String(row[0]).trim(), row[4]);
        }
    });

    let updatedCount = 0;
    reviews.forEach(r => {
        const strId = String(r.id).trim();
        if (idMap.has(strId)) {
            r.summaryQuote = idMap.get(strId);
            updatedCount++;
        }
    });

    fs.writeFileSync(jsonPath, JSON.stringify(reviews, null, 2), 'utf8');
    console.log('Successfully imported and updated ' + updatedCount + ' reviews.');
} catch (e) {
    console.error('Failed to parse CSV:', e);
}
