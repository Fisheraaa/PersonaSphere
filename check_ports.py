
import subprocess
import re

print("Checking all listening ports...\n")

result = subprocess.run(
    ['netstat', '-ano'],
    capture_output=True,
    text=True
)

lines = result.stdout.split('\n')
for line in lines:
    if 'LISTENING' in line:
        print(line.strip())
