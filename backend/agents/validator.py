import requests, json, re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.1"

def validate_completion(action: str, evidence: str) -> dict:
    prompt = f"""Compliance task: {action}
Evidence submitted: {evidence}
Is this evidence sufficient? Reply ONLY with JSON:
{{"approved": true, "reason": "why"}}
JSON:"""

    try:
        res = requests.post(OLLAMA_URL, json={{
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {{"temperature": 0.1}}
        }}, timeout=60)
        raw = res.json()["response"].strip()
        match = re.search(r'\{{.*\}}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"Validator error: {e}")
    return {{"approved": False, "reason": "Validation failed"}}