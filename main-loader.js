
const bytenode = require('bytenode');
const path = require('path');
const fs = require('fs');

// تحديد مسار الملف المشفر
const bytecodePath = path.join(__dirname, 'main.jsc');

if (fs.existsSync(bytecodePath)) {
  // إذا وجد الملف المشفر (في النسخة النهائية)، يتم تشغيله مباشرة
  require(bytecodePath);
} else {
  // في بيئة التطوير، يتم تشغيل الملف الأصلي
  require('./main.js');
}
