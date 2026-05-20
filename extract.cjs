const fs = require('fs');

const inputPath = 'C:\\Users\\KYJ\\.gemini\\antigravity\\brain\\6d3f0488-fb55-4e36-8bb0-b8ea142e2afd\\.system_generated\\steps\\117\\content.md';
const outputPath = 'C:\\Users\\KYJ\\Desktop\\Success247 Renewal Storyboard\\src\\data\\reviews.json';

const content = fs.readFileSync(inputPath, 'utf8');

// Find where window.__REVIEWS__ = starts
const startIndex = content.indexOf('window.__REVIEWS__ = ');
if (startIndex !== -1) {
  const jsonStart = startIndex + 'window.__REVIEWS__ = '.length;
  let jsonString = content.substring(jsonStart).trim();
  if (jsonString.endsWith(';')) {
    jsonString = jsonString.slice(0, -1);
  }
  
  if (!fs.existsSync('C:\\Users\\KYJ\\Desktop\\Success247 Renewal Storyboard\\src\\data')) {
    fs.mkdirSync('C:\\Users\\KYJ\\Desktop\\Success247 Renewal Storyboard\\src\\data');
  }
  
  fs.writeFileSync(outputPath, jsonString);
  console.log('JSON extracted successfully!');
} else {
  console.log('Could not find window.__REVIEWS__ in the file.');
}
