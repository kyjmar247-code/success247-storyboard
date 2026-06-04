const fs = require('fs');
const reviews = JSON.parse(fs.readFileSync('./src/data/reviews.json', 'utf8'));

const branches = new Set(reviews.map(r => r.branch));
console.log(Array.from(branches).sort().join(', '));
