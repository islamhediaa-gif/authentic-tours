const fs = require('fs');
const path = require('path');

const filePath = 'd:/authentic_clean/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix duplicated refs
const duplicatedRefs = /const (sessionId|prevDataRef|lastCloudTimestampRef|skipNextAutoSaveRef) = useRef[\s\S]*?;/g;
// We only want to keep the first occurrence of each
const seen = new Set();
content = content.replace(duplicatedRefs, (match, p1) => {
    if (seen.has(p1)) {
        return '';
    }
    seen.add(p1);
    return match;
});

// Remove the broken manualPush block (lines 311-332 in the current read)
// It starts with 'try {' and ends with '  };' and contains 'DataService.saveData'
// Actually, it's safer to match the exact problematic block
const brokenBlock = /try \{\s+const res = await DataService\.saveData[\s\S]*?notify\("حدث خطأ تقني أثناء الدفع للسحابة\.", "error"\);\s+setSyncStatus\('error'\);\s+\}\s+catch \(err\) \{[\s\S]*?\}\s+\};/g;
// Wait, the block I saw was:
/*
311→    try {
312→      const res = await DataService.saveData(data, sessionId.current, false, force);
...
331→      setSyncStatus('error');
332→    }
333→  };
*/
// The closing brace at 332 belongs to the function that was truncated.

// Let's just remove everything from the first 'try {' after line 305 to the next meaningful declaration
// Or better, let's just use a more specific regex for what we see in the file.
const regex2 = /\s+try\s+\{\s+const res = await DataService\.saveData[\s\S]*?notify\("حدث خطأ تقني أثناء الدفع للسحابة\.", "error"\);\s+setSyncStatus\('error'\);\s+\}\s+\};/g;

content = content.replace(brokenBlock, '');
content = content.replace(regex2, '');

// Clean up syncStatus usage if it's gone
content = content.replace(/setSyncStatus\('.*?'\);/g, '');

fs.writeFileSync(filePath, content);
console.log('App.tsx cleaned up.');
