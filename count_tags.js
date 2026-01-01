const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'pages', 'AdminDashboard.tsx');

try {
    const content = fs.readFileSync(filePath, 'utf8');

    let divOpen = 0;
    let divClose = 0;
    let tableOpen = 0;
    let tableClose = 0;

    const lines = content.split('\n');
    lines.forEach((line, i) => {
        const dO = (line.match(/<div/g) || []).length;
        const dC = (line.match(/<\/div>/g) || []).length;
        divOpen += dO;
        divClose += dC;

        const tO = (line.match(/<table/g) || []).length;
        const tC = (line.match(/<\/table>/g) || []).length;
        tableOpen += tO;
        tableClose += tC;

        if (divOpen !== divClose && (i > 900 && i < 1100)) {
            // console.log(`Line ${i+1}: Div Diff ${divOpen - divClose}`);
        }
    });

    console.log(`Final Counts:`);
    console.log(`Divs: Open ${divOpen}, Close ${divClose}, Diff ${divOpen - divClose}`);
    console.log(`Tables: Open ${tableOpen}, Close ${tableClose}, Diff ${tableOpen - tableClose}`);
} catch (e) {
    console.error(e);
    process.exit(1);
}
