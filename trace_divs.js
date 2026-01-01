const fs = require('fs');
const content = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

let divCount = 0;
const lines = content.split('\n');
lines.forEach((line, i) => {
    const dO = (line.match(/<div/g) || []).length;
    const dC = (line.match(/<\/div>/g) || []).length;
    divCount += dO;
    divCount -= dC;
    if (dO !== dC || dO > 0 || dC > 0) {
        console.log(`Line ${i + 1}: DivCount=${divCount} | ${line.trim().substring(0, 50)}`);
    }
});
