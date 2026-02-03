import json

def check_users_work():
    try:
        with open('Backup_Nebras_Updated.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        users_list = [u for u in data.get('users', []) if u['username'] in ['nada', 'samar']]
        print(f"Users details: {json.dumps(users_list, indent=2)}")
        
        users = {u['username']: u['id'] for u in users_list}
        user_employee_ids = [u.get('employeeId') for u in users_list if u.get('employeeId')]
        print(f"User Employee IDs: {user_employee_ids}")
        
        # Find employees with Arabic names
        emps = {e['id']: e['name'] for e in data.get('employees', []) if 'ندى' in e['name'] or 'سمر' in e['name']}
        print(f"Employees found (Arabic): {json.dumps(emps, indent=2, ensure_ascii=False)}")
        
        txs = data.get('transactions', [])
        if txs:
            print("Transaction structure sample:")
            print(json.dumps(txs[0], indent=2))
        
        programs = data.get('programs', [])
        
        target_ids = list(users.values()) + list(emps.keys())
        
        # Transactions search
        found_txs = [t for t in txs if any(str(val) in target_ids for val in t.values())]
        print(f"Transactions found related to these IDs: {len(found_txs)}")
        
        voided_txs = [t for t in found_txs if t.get('isVoided')]
        active_txs = [t for t in found_txs if not t.get('isVoided')]
        print(f"Active transactions: {len(active_txs)}")
        print(f"Voided transactions: {len(voided_txs)}")
        
        posted_to_program = [t for t in active_txs if t.get('programId')]
        not_posted_to_program = [t for t in active_txs if not t.get('programId')]
        
        print(f"Active transactions posted to programs: {len(posted_to_program)}")
        print(f"Active transactions NOT posted to programs: {len(not_posted_to_program)}")
        
        # Check if there are any specific errors (like missing supplierId or amount 0 when it shouldn't be)
        potential_issues = [t for t in active_txs if not t.get('relatedEntityId') or (t.get('amount') == 0 and t.get('sellingPrice') == 0)]
        print(f"Potential issues found in active transactions: {len(potential_issues)}")
        
        if potential_issues:
            print("Sample issue description:")
            print(json.dumps(potential_issues[0], indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users_work()
