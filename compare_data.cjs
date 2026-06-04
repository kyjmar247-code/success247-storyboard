const fs = require('fs');
const xlsx = require('xlsx');

const jsonPath = './src/data/reviews.json';
const excelPath = './reviews_for_edit.xlsx';

const reviews = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const workbook = xlsx.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(sheet);

console.log('--- Comparison for first 5 items ---');
for (let i = 0; i < 5; i++) {
    const row = excelData[i];
    const id = row['ID'];
    
    // Check all keys in the row to see the exact header name
    const keys = Object.keys(row);
    const quoteKey = keys.find(k => k.includes('자동 추출된 요약문구') || k.includes('요약문구') || k === 'J');
    
    const excelQuote = row[quoteKey];
    
    const review = reviews.find(r => r.id === id);
    const jsonQuote = review ? review.summaryQuote : 'NOT FOUND';
    
    console.log(`ID: ${id}`);
    console.log(`Excel Quote (Key: ${quoteKey}): ${excelQuote}`);
    console.log(`JSON Quote: ${jsonQuote}`);
    console.log(`Match? ${excelQuote === jsonQuote}`);
    console.log('-----------------------------------');
}
