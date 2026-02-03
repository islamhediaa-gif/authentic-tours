import json
import sys

# Reconfigure stdout to use utf-8 to handle Arabic characters in the terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def get_last_logs():
    try:
        with open('Backup_Nebras_Updated.json', encoding='utf-8') as f:
            data = json.load(f)
        logs = data.get('auditLogs', [])
        for log in logs[-10:]:
            print(f"Action: {log.get('action')}, Details: {log.get('details')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    get_last_logs()
