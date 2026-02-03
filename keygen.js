
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const salt = "NEBRAS_SECRET_SALT_2026";

console.log("------------------------------------------");
console.log("   مـولد مفـاتيح تـراخيص نـبراس ERP   ");
console.log("------------------------------------------");

rl.question('أدخل معرف الجهاز (Machine ID): ', (machineId) => {
  rl.question('أدخل اسم العميل (client name من الرابط): ', (tenantId) => {
    if (!machineId || !tenantId) {
      console.log("خطأ: يجب إدخال كافة البيانات.");
      rl.close();
      return;
    }

    let hash = 0;
    // الخوارزمية الجديدة: Machine ID + Tenant ID + Salt
    const str = machineId.trim().toUpperCase() + tenantId.trim().toLowerCase() + salt;
    
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    
    const licenseKey = "NBR-" + Math.abs(hash).toString(16).toUpperCase();
    
    console.log("\n✅ تم توليد المفتاح بنجاح:");
    console.log(`معرف الجهاز: ${machineId.trim().toUpperCase()}`);
    console.log(`اسم العميل: ${tenantId.trim()}`);
    console.log(`رقم الترخيص: ${licenseKey}`);
    console.log("------------------------------------------\n");

    rl.close();
  });
});
