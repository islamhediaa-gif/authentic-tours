import json

def calculate_balances():
    try:
        with open('d:/authentic/Backup_Nebras_Updated.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        fathy_id = '1768423988364'
        mohamed_id = '1768562633189'
        
        balances = {
            fathy_id: {'name': 'فتحي الحصري', 'debit': 0, 'credit': 0},
            mohamed_id: {'name': 'محمد قاسم ديار الديوانية', 'debit': 0, 'credit': 0}
        }
        
        journal_entries = data.get('journalEntries', [])
        for je in journal_entries:
            for line in je.get('lines', []):
                acc_id = line.get('accountId')
                if acc_id in balances:
                    balances[acc_id]['debit'] += float(line.get('debit', 0))
                    balances[acc_id]['credit'] += float(line.get('credit', 0))
        
        for acc_id, info in balances.items():
            # For suppliers, balance is usually Credit - Debit
            balance = info['credit'] - info['debit']
            print(f"{info['name']}:")
            print(f"  Total Credit: {info['credit']:,.2f}")
            print(f"  Total Debit: {info['debit']:,.2f}")
            print(f"  Net Balance: {balance:,.2f}")
            print("-" * 30)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    calculate_balances()
