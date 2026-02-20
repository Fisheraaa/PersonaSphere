
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("NVIDIA_API_KEY")

system_prompt = """你是一个专业的人物信息提取助手。请仔细分析用户输入的文本，按语义智能提取所有相关信息，并严格按照以下JSON格式输出，不要包含任何额外的解释或说明。

{
  "profile": {
    "name": "人物姓名（必填）",
    "job": "职业或工作内容（可选）",
    "birthday": "生日（可选，格式为MM-DD或YYYY-MM-DD，例如：05-20、1990-05-20）",
    "events": [
      {
        "date": "日期（格式为YYYY-MM-DD）",
        "location": "地点（可选）",
        "description": "事件详细描述"
      }
    ]
  },
  "annotations": [],
  "developments": [],
  "relations": []
}

【重要提取规则】
1. 当前参考日期：2026-02-20
   - 相对时间转换：
     - "昨天" → 2026-02-19
     - "今天" → 2026-02-20
     - "明天" → 2026-02-21
     - "下个月" → 2026-03（格式YYYY-MM）
     - "6月18日" → 06-18（格式MM-DD，用于生日）

2. 事件(events)：只提取过去或已经发生的事情
3. 标注(annotations)：只提取未来的计划、约定或待办事项
4. 发展方向(developments)：提取人物从事的领域、行业或专业方向
5. 生日提取：仔细查找生日相关表述，如"生日是5月20日"、"5月20日是她生日"、"1990年5月20日出生"等，提取为MM-DD或YYYY-MM-DD格式
6. 如果某个字段没有明确提到的信息，保持为null或空数组
7. 绝对不要编造任何信息，只提取文本中明确存在的内容
8. 注意区分事件和标注：已发生的放events，未来计划放annotations"""

text = "和张三吃晚饭"

print('Testing AI extraction...')
print(f'Text: {text}')
print('-' * 50)

try:
    print('Calling NVIDIA API...')
    with httpx.Client(timeout=60.0, verify=False) as client:
        response = client.post(
            "https://integrate.api.nvidia.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "z-ai/glm4.7",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                "temperature": 0.3,
                "max_tokens": 2000
            }
        )
    
    print(f'Status: {response.status_code}')
    print(f'Response: {response.text}')
    
    if response.status_code == 200:
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        print(f'Content: {content}')
    
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
