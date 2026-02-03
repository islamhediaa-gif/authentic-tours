import json
import urllib.request
import urllib.parse

def update_supabase():
    # Use user_backups table as found in SupabaseService.ts
    url = "https://rzjjmacmwocusqeoyyhu.supabase.co/rest/v1/user_backups?user_id=eq.authentic&select=data"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg"
    }
    
    print("Fetching current data from Supabase (table: user_backups)...")
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            records = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        return
    except Exception as e:
        print(f"Failed to fetch data: {e}")
        return

    if not records:
        print("No backup found for user_id 'authentic'")
        return
    
    data = records[0]['data']
    
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

    print(f"Applied changes locally: {count_t} transactions, {count_je} journal entries.")

    # PATCH request to update
    update_url = "https://rzjjmacmwocusqeoyyhu.supabase.co/rest/v1/user_backups?user_id=eq.authentic"
    update_headers = headers.copy()
    update_headers["Content-Type"] = "application/json"
    
    print("Uploading updated data to Supabase...")
    json_data = json.dumps({"data": data}).encode('utf-8')
    req = urllib.request.Request(update_url, data=json_data, headers=update_headers, method='PATCH')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                print("Successfully updated Supabase data!")
            else:
                print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to upload: {e}")

if __name__ == '__main__':
    update_supabase()
