const fs = require('fs');
const fetch = require('node-fetch');

const tenantId = 'authentic';
const apiUrl = 'https://authentic-tours-production.up.railway.app/api/admin/super-restore';
const backupPath = 'd:\\authentic\\Backup_Nebras_2026-02-052.json';

async function runSuperUpload() {
    console.log('🚀 بدء عملية الرفع الخارقة (Super Upload) ...');
    
    if (!fs.existsSync(backupPath)) {
        console.error(`❌ الملف غير موجود: ${backupPath}`);
        return;
    }

    const fileContent = fs.readFileSync(backupPath, 'utf8');
    const rawData = JSON.parse(fileContent);
    const data = rawData.data || rawData;

    console.log(`📦 جاري تحضير البيانات:`);
    console.log(`- Transactions: ${data.transactions?.length || 0}`);
    console.log(`- Journal Entries: ${data.journalEntries?.length || 0}`);
    if (data.journalEntries && data.journalEntries.length > 0) {
        const linesCount = data.journalEntries.reduce((acc, curr) => acc + (curr.lines?.length || 0), 0);
        console.log(`- Journal Lines in Entries: ${linesCount}`);
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenant_id: tenantId,
                data: data
            }),
            timeout: 300000 // 5 minutes timeout
        });

        const result = await response.json();

        if (result.success) {
            console.log('\n✅ اكتملت عملية الرفع الخارقة بنجاح باهر!');
            console.log('📊 النتائج:', JSON.stringify(result.results, null, 2));
        } else {
            console.error('\n❌ فشلت عملية الرفع:', result.error);
        }
    } catch (error) {
        console.error('\n❌ حدث خطأ أثناء الاتصال بالسيرفر:', error.message);
    }
}

runSuperUpload();
