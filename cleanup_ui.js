
const fs = require('fs');
const path = require('path');

// 1. Clean Header.tsx
const headerPath = 'D:/authentic_clean/components/Header.tsx';
if (fs.existsSync(headerPath)) {
    let content = fs.readFileSync(headerPath, 'utf8');
    
    // Remove sync-related props and imports
    content = content.replace(/syncStatus\?:.*?;/g, '');
    content = content.replace(/onManualPull\?:.*?;/g, '');
    content = content.replace(/onManualPush\?:.*?;/g, '');
    content = content.replace(/CloudUpload,\s*CloudDownload/g, '');
    content = content.replace(/syncStatus\s*=\s*'idle',\s*onManualPull,\s*onManualPush,/g, '');
    
    // Remove the sync buttons JSX
    content = content.replace(/<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">[\s\S]*?<\/div>/g, '');
    
    fs.writeFileSync(headerPath, content);
    console.log('Header.tsx cleaned');
}

// 2. Clean Sidebar.tsx
const sidebarPath = 'D:/authentic_clean/components/Sidebar.tsx';
if (fs.existsSync(sidebarPath)) {
    let content = fs.readFileSync(sidebarPath, 'utf8');
    
    // Remove license/trial logic
    content = content.replace(/licenseInfo\?: \{ isActivated: boolean \};/g, '');
    content = content.replace(/daysLeft\?: number;/g, '');
    content = content.replace(/licenseInfo,\s*daysLeft/g, '');
    content = content.replace(/\{licenseInfo && !licenseInfo\.isActivated && \([\s\S]*?\)\}/g, '');
    
    fs.writeFileSync(sidebarPath, content);
    console.log('Sidebar.tsx cleaned');
}

// 3. Clean SettingsView.tsx (Remove Cloud Sync settings section)
const settingsPath = 'D:/authentic_clean/components/SettingsView.tsx';
if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    
    // Remove Cloud Sync section
    content = content.replace(/<div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">[\s\S]*?إعدادات المزامنة السحابية[\s\S]*?<\/div>/g, '');
    
    fs.writeFileSync(settingsPath, content);
    console.log('SettingsView.tsx cleaned');
}
