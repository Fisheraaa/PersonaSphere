
import requests
import json
import traceback

try:
    print('Testing /extract endpoint...')
    response = requests.post(
        'http://127.0.0.1:8000/extract',
        json={'text': '和张三吃晚饭'},
        timeout=60
    )
    print('Status Code:', response.status_code)
    print('Headers:', response.headers)
    print('Response:', response.text)
    print('Response JSON:', response.json() if response.status_code == 200 else None)
except Exception as e:
    print('Error:', str(e))
    print('Traceback:')
    traceback.print_exc()
