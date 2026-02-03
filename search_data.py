import os
import json

targets = ['13360', '168310', '168336']
files = [f for f in os.listdir('.') if f.endswith('.json')]

for f_name in files:
    print(f"Searching in {f_name}...")
    try:
        with open(f_name, 'r', encoding='utf-8') as f:
            # For large files, read line by line or use a buffer
            for i, line in enumerate(f):
                for t in targets:
                    if t in line:
                        print(f"MATCH {t} in {f_name} at line {i+1}")
    except Exception as e:
        print(f"Error reading {f_name}: {e}")
