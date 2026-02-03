import json
import urllib.request
import urllib.parse

def update_supabase_from_new_backup():
    new_backup_path = 'd:/authentic/Backup_Nebras_2026-01-28 (4).json'
    
    print(f"Reading new backup from {new_backup_path}...")
    try:
        with open(new_backup_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Failed to read file: {e}")
        return

    fathy_id = '1768423988364'
    mohamed_id = '1768562633189'
    target_refs = ['PV-0109', 'PV-0104']
    je_ids = [f"JE-{tid}" for tid in ['1768913546823', '1768912938151']]

    # 1. Update Transactions
    count_t = 0
    for t in data.get('transactions', []):
        if t.get('refNo') in target_refs:
            t['supplierId'] = mohamed_id
            t['relatedEntityId'] = mohamed_id
            count_t += 1
            
    # 2. Update Journal Entries
    count_je = 0
    for je in data.get('journalEntries', []):
        if je.get('id') in je_ids:
            for line in je.get('lines', []):
                if line.get('accountId') == fathy_id:
                    line['accountId'] = mohamed_id
                    line['accountName'] = 'محمد قاسم ديار الديوانية'
            count_je += 1

    # 3. Update Programs/Components for operational consistency
    for p in data.get('programs', []):
        for comp in p.get('components', []):
            if comp.get('supplierId') == fathy_id:
                if any(desc in (comp.get('name') or '') for desc in ['ابراج مكه', 'هليتون مكه']):
                    comp['supplierId'] = mohamed_id

    print(f"Applied changes to local data: {count_t} transactions, {count_je} journal entries.")

    # Upload to Supabase
    update_url = "https://rzjjmacmwocusqeoyyhu.supabase.co/rest/v1/user_backups?user_id=eq.authentic"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg",
        "Content-Type": "application/json"
    }
    
    from datetime import datetime
    now_iso = datetime.utcnow().isoformat() + 'Z'
    
    # Force the internal lastUpdated to be current so it wins over local data
    data['lastUpdated'] = now_iso
    
    print("Uploading NEW backup data to Supabase...")
    # Wrap in data field as per table schema
    json_payload = json.dumps({"data": data, "updated_at": now_iso}).encode('utf-8')
    req = urllib.request.Request(update_url, data=json_payload, headers=headers, method='PATCH')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                print("Successfully updated Supabase with the NEW backup!")
            else:
                print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to upload: {e}")

if __name__ == '__main__':
    update_supabase_from_new_backup()
