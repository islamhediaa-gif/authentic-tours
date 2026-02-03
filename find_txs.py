import json

def find_transactions():
    with open('Backup_Nebras_Updated.json', encoding='utf-8') as f:
        data = json.load(f)
    
    entity_id = '1768562633189'
    txs = [t for t in data.get('transactions', []) if t.get('relatedEntityId') == entity_id]
    
    # Sort by date and id (as proxy for creation time)
    txs.sort(key=lambda x: (x.get('date', ''), x.get('id', '')))
    
    for t in txs:
        print(f"ID: {t.get('id')}, Date: {t.get('date')}, Amount: {t.get('amount')}, Rate: {t.get('exchangeRate')}, Base: {t.get('amountInBase')}")

if __name__ == '__main__':
    find_transactions()
