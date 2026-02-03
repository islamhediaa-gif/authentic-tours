const fs = require('fs');
const path = require('path');

const filePath = 'd:/authentic_clean/components/Header.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Remove cloud-related props from interface
content = content.replace(/onManualPull\?: \(\) => void;\s+onManualPush\?: \(\) => void;\s+syncStatus\?: 'connected' | 'syncing' | 'error';/g, '');
// Handle cases where they might be separate
content = content.replace(/onManualPull\?:.*?;/g, '');
content = content.replace(/onManualPush\?:.*?;/g, '');
content = content.replace(/syncStatus\?:.*?;/g, '');

// Remove from destructuring
content = content.replace(/onManualPull, onManualPush, syncStatus,/g, '');

// Remove the cloud buttons block
// Match from the start of the cloud buttons div to the end of it
const cloudButtonsRegex = /<button\s+onClick=\{onManualPull\}[\s\S]*?<\/button>\s+<\/div>/g;
content = content.replace(cloudButtonsRegex, '');

// Wait, the previous cleanup might have left broken tags. 
// Let's just fix the specific nesting issue found.
// The div at line 233 should close at 376.
// Currently it seems to close at 309.

// Let's remove the extra </div> at 309 (if it exists)
// It follows the notifications div
content = content.replace(/\}\s+<\/div>\s+<\/div>\s+<\/div>\s+<div className="h-10 w-px/g, '}          </div>        </div>        <div className="h-10 w-px');

// Actually, let's do a more robust cleanup of the Header.
// I'll just rewrite the problematic section or the whole return.

fs.writeFileSync(filePath, content);
console.log('Header.tsx cleaned up.');
