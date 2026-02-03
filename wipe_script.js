
const API_URL = 'https://authentic-tours-production.up.railway.app';
const tenantId = 'authentic';

async function wipe() {
    console.log(`Attempting to wipe all data for tenant: ${tenantId}...`);
    try {
        const response = await fetch(`${API_URL}/api/wipe/${tenantId}`, {
            method: 'DELETE'
        });
        const res = await response.json();
        console.log('Wipe result:', res);
    } catch (e) {
        console.error('Wipe failed:', e);
    }
}

wipe();
