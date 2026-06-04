const fs = require('fs');
const xlsx = require('xlsx');

const jsonFile = './src/data/reviews.json';
const excelFile = 'reviews_with_keywords.xlsx';

let data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

const wb = xlsx.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const excelData = xlsx.utils.sheet_to_json(ws);

let updatedCount = 0;

excelData.forEach(row => {
  const excelId = row.ID;
  const excelTagsStr = row['핵심 키워드 (필터용)'];
  
  if (excelTagsStr !== undefined) {
    // excelTagsStr might have leading/trailing spaces
    const excelTags = excelTagsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    let review = data.find(r => r.id === excelId);
    if (review) {
      // compare
      const oldTagsStr = review.tags.join(',');
      const newTagsStr = excelTags.join(',');
      if (oldTagsStr !== newTagsStr) {
        review.tags = excelTags;
        updatedCount++;
      }
    }
  }
});

fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));

console.log(`Updated tags for ${updatedCount} reviews from Excel to JSON.`);
