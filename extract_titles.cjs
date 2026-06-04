const fs = require('fs');
const reviews = JSON.parse(fs.readFileSync('./src/data/reviews.json', 'utf8'));

const titles = new Set();
reviews.forEach(r => {
    if (r.coachingTitle) r.coachingTitle.split(',').forEach(t => titles.add(t.trim()));
    if (r.learningTitle) r.learningTitle.split(',').forEach(t => titles.add(t.trim()));
    if (r.lifeTitle) r.lifeTitle.split(',').forEach(t => titles.add(t.trim()));
    if (r.contentTitle) r.contentTitle.split(',').forEach(t => titles.add(t.trim()));
});

console.log(Array.from(titles).sort());
