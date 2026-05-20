const fs = require('fs');

const csvPath = './reviews_export.csv';
const jsonPath = './src/data/reviews.json';

const csvContent = fs.readFileSync(csvPath, 'utf8');

// Robust CSV parser handling quotes and newlines inside columns
function parseCSV(str) {
    let arr = [];
    let quote = false;
    let row = [];
    let col = '';
    for (let c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        if (cc === '"' && quote && nc === '"') { col += '"'; ++c; continue; }
        if (cc === '"') { quote = !quote; continue; }
        if (cc === ',' && !quote) { row.push(col); col = ''; continue; }
        if (cc === '\n' && !quote) {
            if (col.endsWith('\r')) col = col.slice(0, -1);
            row.push(col);
            arr.push(row);
            col = ''; row = [];
            continue;
        }
        col += cc;
    }
    if (col || row.length) { 
        if (col.endsWith('\r')) col = col.slice(0, -1);
        row.push(col); 
        arr.push(row); 
    }
    return arr;
}

let contentToParse = csvContent.charCodeAt(0) === 0xFEFF ? csvContent.slice(1) : csvContent;
const rows = parseCSV(contentToParse);

// Assuming header is row 0: id, name, branch, studentType, summaryQuote
const dataRows = rows.slice(1).filter(r => r && r.length >= 5 && r[0]); 

const reviews = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const idMap = new Map();
dataRows.forEach(row => {
    idMap.set(row[0], row[4]); // Map ID to summaryQuote
});

let updatedCount = 0;
reviews.forEach(r => {
    if (idMap.has(r.id)) {
        r.summaryQuote = idMap.get(r.id);
        updatedCount++;
    }
});

fs.writeFileSync(jsonPath, JSON.stringify(reviews, null, 2), 'utf8');
console.log('Imported and updated ' + updatedCount + ' reviews from CSV.');
