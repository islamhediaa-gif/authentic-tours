
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDates() {
    // استخدام المتغيرات التفصيلية بدلاً من URL الكامل لتجنب مشاكل المكتبة
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT || 3306
    });
    console.log('Connected to MySQL via detailed params...');

    try {
        // 1. إصلاح جدول العمليات (Transactions)
        console.log('Fixing transactions dates (trimming time)...');
        await connection.execute(`
            UPDATE transactions 
            SET date = LEFT(date, 10) 
            WHERE date LIKE '%-%-%' AND LENGTH(date) > 10
        `);

        // 2. إصلاح جدول قيود اليومية (Journal Entries)
        console.log('Fixing journal entries dates (trimming time)...');
        await connection.execute(`
            UPDATE journal_entries 
            SET date = LEFT(date, 10) 
            WHERE date LIKE '%-%-%' AND LENGTH(date) > 10
        `);

        // 3. التأكد من تحويل أي تواريخ مائلة / إلى -
        console.log('Normalizing date separators...');
        await connection.execute(`UPDATE transactions SET date = REPLACE(date, '/', '-') WHERE date LIKE '%/%'`);
        await connection.execute(`UPDATE journal_entries SET date = REPLACE(date, '/', '-') WHERE date LIKE '%/%'`);

        console.log('✅ All dates fixed successfully!');
    } catch (err) {
        console.error('❌ Error fixing dates:', err);
    } finally {
        await connection.end();
    }
}

fixDates();
