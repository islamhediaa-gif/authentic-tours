
// 1. مسح متغير النظام لضمان عمل Electron بشكل صحيح (يجب أن يكون في البداية)
delete process.env.ELECTRON_RUN_AS_NODE;

const electron = require('electron');
const { app, BrowserWindow, ipcMain, webFrameMain } = electron;
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
require('dotenv').config();

// دالة لجلب هوية الجهاز الفريدة
function getMachineId() {
  try {
    let id = '';
    if (process.platform === 'win32') {
      id = execSync('wmic csproduct get uuid').toString().split('\n')[1].trim();
    } else {
      id = execSync('cat /etc/machine-id').toString().trim();
    }
    // تشفير الهوية لجعلها كود أقصر وأكثر غموضاً للعميل
    return crypto.createHash('md5').update(id + 'nebras_salt_2026').digest('hex').toUpperCase().substring(0, 16);
  } catch (e) {
    return 'UNKNOWN-MACHINE-ID';
  }
}
const machineId = getMachineId();

// Load FingerprintService (handling compiled version in production)
const fpServicePath = path.join(__dirname, 'services', 'FingerprintService.jsc');
let fingerprintService;
if (fs.existsSync(fpServicePath)) {
  fingerprintService = require(fpServicePath);
} else {
  fingerprintService = require('./services/FingerprintService');
}

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (err) {
  const userDataPath = app.getPath('userData');
  fs.appendFileSync(path.join(userDataPath, 'crash_report.txt'), `Failed to load mysql2: ${err.message}\n`);
}

let dbFile;
let sqlPool = null;
let splash;
let mainWindow;

async function initSql() {
  if (process.env.DB_HOST) {
    try {
      sqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('SQL Pool created successfully');
    } catch (err) {
      console.error('Failed to create SQL Pool:', err);
    }
  }
}

function initPaths() {
  try {
    const userDataPath = app.getPath('userData');
    dbFile = path.join(userDataPath, 'nebras_db.json');
    
    // تهيئة قاعدة البيانات إذا لم تكن موجودة
    if (!fs.existsSync(dbFile)) {
      const appPath = app.getAppPath();
      const initialDbPath = path.join(appPath, 'initial_database.json');
      
      if (fs.existsSync(initialDbPath)) {
        fs.copyFileSync(initialDbPath, dbFile);
        console.log('Database initialized from initial_database.json');
      } else {
        // محاولة بديلة إذا كان المسار مختلفاً
        const fallbackInitialPath = path.join(__dirname, 'initial_database.json');
        if (fs.existsSync(fallbackInitialPath)) {
          fs.copyFileSync(fallbackInitialPath, dbFile);
          console.log('Database initialized from fallback initial_database.json');
        }
      }
    }
    
    // إنشاء ملف سجل أخطاء بسيط في مجلد البيانات
    const logFile = path.join(userDataPath, 'crash_report.txt');
    fs.appendFileSync(logFile, `App started at ${new Date().toISOString()}\n`);
  } catch (e) {
    console.error('Failed to initialize paths:', e);
  }
}

function createSplashScreen() {
  splash = new BrowserWindow({
    width: 500,
    height: 350,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    icon: path.join(__dirname, 'logo.jfif'),
    webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
    }
  });
  splash.loadFile(path.join(__dirname, 'splash.html'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "نبراس المحاسبي ERP - النسخة الاحترافية 3.0.1",
    icon: path.join(__dirname, 'logo.jfif'),
    backgroundColor: '#ffffff',
    frame: false, // إخفاء الإطار العلوي وشريط المهام بالكامل
    show: false, // إخفاء النافذة حتى تصبح جاهزة
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false
    }
  });

  // تحديد المسار باستخدام app.getAppPath لضمان الدقة داخل وخارج الـ ASAR
  const appPath = app.getAppPath();
  const indexPath = path.join(appPath, 'dist', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Error loading index.html:', err);
    });
  } else {
    // محاولة أخيرة في حال كان الهيكل مختلفاً
    const fallbackPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(fallbackPath)) {
      mainWindow.loadFile(fallbackPath);
    } else {
      mainWindow.loadURL('data:text/html,<html><body style="background:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial;"><div><h1 style="color:red">Error: dist/index.html not found</h1><p>Path: ' + indexPath + '</p></div></body></html>');
    }
  }

  // عندما تكون النافذة جاهزة للعرض
  mainWindow.once('ready-to-show', () => {
    // لا نقوم بالعرض هنا، ننتظر إشارة app-ready من الـ Renderer
    console.log('Main window ready-to-show');
  });

  // Safety timeout to show the window if app-ready is never received
  const safetyTimeout = setTimeout(() => {
    if (splash) {
      console.log('Safety timeout: closing splash and showing main window');
      splash.close();
      splash = null;
      if (mainWindow) {
        mainWindow.show();
        // mainWindow.maximize();
      }
    }
  }, 10000);

  // استقبال إشارة اكتمال تحميل البيانات من الواجهة الأمامية
  ipcMain.on('app-ready', () => {
    clearTimeout(safetyTimeout);
    if (splash) {
      splash.close();
      splash = null;
    }
    if (mainWindow) {
      mainWindow.show();
      // mainWindow.maximize(); // اختياريا يمكن تفعيل التكبير التلقائي
    }
  });

  // التعامل مع فشل التحميل
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (errorCode !== -3) { // Ignore aborted requests
      mainWindow.loadURL('http://localhost:5173').catch(() => {
        if (splash) splash.close();
        mainWindow.show();
        mainWindow.loadURL(`data:text/html,<html><body style="background: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Cairo, sans-serif; direction: rtl;">
          <div style="text-align: center;">
            <h1 style="color: #e11d48;">فشل تحميل النظام</h1>
            <p>برجاء التأكد من وجود مجلد dist أو تشغيل سيرفر التطوير.</p>
            <p style="font-size: 12px; color: #64748b;">خطأ: ${errorDescription}</p>
          </div>
        </body></html>`);
      });
    }
  });

  // إزالة القائمة الافتراضية
  mainWindow.setMenu(null);
}

app.whenReady().then(() => {
  createSplashScreen();
  initPaths();
  initSql(); // لا ننتظر هنا لسرعة التشغيل
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// النسخ الاحتياطي التلقائي عند الخروج
app.on('before-quit', () => {
  try {
    if (fs.existsSync(dbFile)) {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'Backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_Final';
      const backupFile = path.join(backupDir, `Backup_Auto_Exit_${timestamp}.json`);
      
      fs.copyFileSync(dbFile, backupFile);
      console.log('Final auto-backup created on exit');
    }
  } catch (err) {
    console.error('Exit backup error:', err);
  }
});

// التعامل مع قاعدة البيانات
ipcMain.handle('db-load', async () => {
  try {
    let updated = false;
    if (fs.existsSync(dbFile)) {
      const content = await fs.promises.readFile(dbFile, 'utf8');
      const db = JSON.parse(content);
      
      // تهيئة بيانات الترخيص وإجبار التنشيط
      if (!db.licenseInfo) {
        db.licenseInfo = {
          installationDate: "2026-01-01T00:00:00.000Z",
          isActivated: true,
          licenseKey: "NEBRAS-PRO-2026-PERPETUAL",
          machineId: machineId
        };
        updated = true;
      } else {
        // تحديث البيانات لضمان التنشيط الدائم
        db.licenseInfo.isActivated = true;
        db.licenseInfo.licenseKey = "NEBRAS-PRO-2026-PERPETUAL";
        if (!db.licenseInfo.installationDate) {
          db.licenseInfo.installationDate = "2026-01-01T00:00:00.000Z";
        }
        db.licenseInfo.machineId = machineId;
        updated = true;
      }

      if (updated) {
        await fs.promises.writeFile(dbFile, JSON.stringify(db, null, 2), 'utf8');
      }

      return { success: true, data: db, machineId: machineId };
    }
    return { success: false, error: 'File not found' };
  } catch (e) {
    console.error('Load error:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('db-save', async (event, data) => {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(dbFile, content, 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Save error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-auto-backup', async (event, data) => {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'Backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().getHours() + '-' + new Date().getMinutes();
    const backupFile = path.join(backupDir, `Backup_Nebras_${timestamp}.json`);
    
    await fs.promises.writeFile(backupFile, JSON.stringify(data, null, 2), 'utf8');
    
    // الاحتفاظ بآخر 10 نسخ فقط لتوفير المساحة
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('Backup_Nebras_'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
      
    if (files.length > 10) {
      files.slice(10).forEach(f => fs.unlinkSync(path.join(backupDir, f.name)));
    }
    
    return { success: true, path: backupFile };
  } catch (err) {
    console.error('Auto-backup error:', err);
    return { success: false, error: err.message };
  }
});

// التحكم في النافذة (Maximize, Minimize, Close)
ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  
  switch (action) {
    case 'minimize':
      win.minimize();
      break;
    case 'maximize':
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
      break;
    case 'close':
      win.close();
      break;
  }
});

// --- Fingerprint Device IPC Handlers ---
async function saveFingerprintLogs(newLogs) {
  try {
    if (!fs.existsSync(dbFile)) return 0;
    const content = await fs.promises.readFile(dbFile, 'utf8');
    const db = JSON.parse(content);
    if (!db.attendanceLogs) db.attendanceLogs = [];
    
    let addedCount = 0;
    const logsArray = Array.isArray(newLogs) ? newLogs : [newLogs];
    
    logsArray.forEach(log => {
      const exists = db.attendanceLogs.some(l => 
        l.deviceUserId == log.deviceUserId && 
        new Date(l.recordTime).getTime() === new Date(log.recordTime).getTime()
      );
      if (!exists) {
        db.attendanceLogs.push(log);
        addedCount++;
      }
    });
    
    if (addedCount > 0) {
      await fs.promises.writeFile(dbFile, JSON.stringify(db, null, 2), 'utf8');
      console.log(`Added ${addedCount} new attendance logs`);
    }
    return addedCount;
  } catch (err) {
    console.error('Error saving FP logs:', err);
    return 0;
  }
}

ipcMain.handle('fp-connect', async (event, config) => {
  return await fingerprintService.connect(config?.ip, config?.port);
});

ipcMain.handle('fp-get-logs', async () => {
  const result = await fingerprintService.getAttendanceLogs();
  if (result.success && result.data) {
    await saveFingerprintLogs(result.data);
  }
  return result;
});

ipcMain.handle('fp-get-users', async () => {
  return await fingerprintService.getUsers();
});

ipcMain.on('fp-setup-realtime', async (event) => {
  const result = await fingerprintService.setupRealTime(async (data) => {
    await saveFingerprintLogs(data);
    event.sender.send('fp-realtime-log', data);
  });
  event.reply('fp-setup-realtime-response', result);
});

ipcMain.handle('fp-disconnect', async () => {
  await fingerprintService.disconnect();
  return { success: true };
});
// ----------------------------------------

// منع الانهيار المفاجئ
process.on('uncaughtException', (err) => {
  try {
    console.error('Uncaught Exception:', err);
    const userDataPath = app.getPath('userData');
    fs.appendFileSync(path.join(userDataPath, 'crash_report.txt'), `Error: ${err.message}\n${err.stack}\n`);
  } catch (e) {}
});
