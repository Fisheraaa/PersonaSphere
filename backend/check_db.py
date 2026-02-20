
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, 'data', 'app.db')

print(f"Database path: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")
print()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== Tables ===")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
for table in tables:
    print(f"- {table[0]}")

print("\n=== Persons ===")
cursor.execute("SELECT id, name, created_at FROM persons;")
persons = cursor.fetchall()
if persons:
    for person in persons:
        print(f"ID: {person[0]}, Name: {person[1]}, Created: {person[2]}")
else:
    print("No persons found")

conn.close()
