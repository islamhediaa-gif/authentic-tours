
import json
with open('Backup_Nebras_2026-01-28 (4).json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(json.dumps(data['journalEntries'][:3], indent=2, ensure_ascii=False))
