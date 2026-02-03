import json
import urllib.request
import os

def sync():
    file_path = 'd:/authentic/Backup_Nebras_Updated.json'
    if not os.path.exists(file_path):
        print(f"File {file_path} not found.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        full_data = json.load(f)

    # Supabase credentials (taken from update_supabase.py)
    url = "https://rzjjmacmwocusqeoyyhu.supabase.co/rest/v1/user_backups?user_id=eq.authentic"
    headers = {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6amptYWNtd29jdXNxZW95eWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjY0NzksImV4cCI6MjA4NDc0MjQ3OX0.VqHRuZXbecsSu9Fzo6ilU8NimO_gwTnQDGC_yAklfYg",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    print("Uploading clean local backup to Supabase...")
    payload = {"data": full_data, "updated_at": "2026-01-27T23:23:00Z"} # Update timestamp
    json_data = json.dumps(payload).encode('utf-8')
    
    req = urllib.request.Request(url, data=json_data, headers=headers, method='PATCH')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status in [200, 201, 204]:
                print("Successfully synced with Supabase cloud!")
            else:
                print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to sync: {e}")

if __name__ == "__main__":
    sync()
