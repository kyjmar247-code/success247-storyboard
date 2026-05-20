const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/data/reviews.json', 'utf8'));

// BOM is important so Excel opens the CSV correctly with UTF-8 encoding
let csv = '\uFEFFid,name,branch,studentType,summaryQuote\n';

data.forEach(r => {
  let q = typeof r.summaryQuote === 'string' ? r.summaryQuote : (r.summaryQuote ? r.summaryQuote.join(' ') : '');
  // Escape quotes for CSV
  q = q.replace(/"/g, '""');
  csv += `"${r.id || ''}","${r.name || ''}","${r.branch || ''}","${r.studentType || ''}","${q}"\n`;
});

fs.writeFileSync('./reviews_export.csv', csv, 'utf8');
console.log('Exported ' + data.length + ' reviews to reviews_export.csv');
