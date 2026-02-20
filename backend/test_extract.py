
import requests
import json

try:
    response = requests.post(
        'http://127.0.0.1:8001/extract',
        json={'text': '和张三吃晚饭'}
    )
    print('Status:', response.status_code)
    print('Response:', response.text)
except Exception as e:
    print('Error:', e)
