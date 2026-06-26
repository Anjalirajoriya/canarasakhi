import requests, json, re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.1"

def parse_circular(text: str) -> tuple[list[dict], str]:

    text_lower = text.lower()

    # Basic RBI/SEBI document check
    keywords = ["rbi", "reserve bank", "sebi", "circular", "bank",
                "regulation", "fema", "nbfc", "directive", "notification"]
    if not any(k in text_lower for k in keywords):
        return [], "Not an RBI/SEBI document"

    prompt = """You are a senior compliance officer at Canara Bank.

A new RBI/SEBI document has arrived. Your job is to find EVERY task
that bank employees must actually DO because of this document.

Think like an employee reading this:
- What do I need to action?
- What do I need to implement or change?
- What do I need to submit or report?
- What do I need to stop doing or start doing?
- What do I need to check or verify?
- What training or awareness needs to happen?

RULES FOR EXTRACTION:
1. Only include tasks where a specific bank employee/department must DO something
2. If document just announces news with no employee action -> maps must be empty []
3. For deadline_days: extract EXACT number if stated (e.g. "within 30 days" = 30,
   "3 months" = 90). If truly not stated -> use -1
4. For deadline_text: copy EXACT words from document about timing, or "Not specified"
5. For penalty: ONLY copy exact words if penalty is explicitly stated, else use ""
6. For evidence_required: what proof must employee submit to show task is done
7. Department assignment:
   - IT systems, digital banking, cybersecurity, technology -> IT
   - Loans, advances, credit limits, exposure norms, KYC -> Credit
   - Legal filings, regulatory submissions, audit -> Legal
   - Staff training, awareness, HR policies -> HR
   - Foreign exchange, investments, treasury operations -> Treasury
   - Branch operations, customer service, general banking -> Operations

Return ONLY valid JSON. No explanation. No markdown. Start with { end with }

{
  "summary": "one clear sentence about what this document requires banks to do",
  "maps": [
    {
      "action": "specific task written as instruction e.g. Submit cybersecurity report to RBI",
      "department": "IT or Credit or Legal or HR or Treasury or Operations",
      "deadline_days": -1,
      "deadline_text": "exact words from document or Not specified",
      "priority": "High if mandatory, Medium if advisory, Low if informational",
      "risk_level": "Critical if heavy penalty, High if mandatory, Medium if advisory, Low if informational",
      "evidence_required": "what proof employee must produce or Not specified",
      "penalty_if_missed": "exact penalty text from document only or empty string"
    }
  ]
}

DOCUMENT:
""" + text[:4000] + """

JSON:"""

    try:
        res = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.05,
                "top_p": 0.8
            }
        }, timeout=180)

        raw = res.json()["response"].strip()

        # Extract JSON object
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            print("No JSON found in response")
            return [], "Could not parse document"

        data = json.loads(match.group())
        summary = data.get("summary", "")
        maps = data.get("maps", [])
        clean = [m for m in maps if is_valid(m)]
        print(f"Extracted {len(clean)} valid MAPs")
        return clean, summary

    except Exception as e:
        print(f"Parser error: {e}")
        return [], ""


DEPTS = {"Credit", "Treasury", "IT", "HR", "Legal", "Operations"}
PRIORITIES = {"High", "Medium", "Low"}


def is_valid(m):
    required = ["action", "department", "deadline_days",
                "priority", "evidence_required"]
    if not all(k in m for k in required):
        return False
    if m["department"] not in DEPTS:
        return False
    if m["priority"] not in PRIORITIES:
        return False
    if not isinstance(m["deadline_days"], int):
        return False
    if len(m.get("action", "")) < 10:
        return False
    return True