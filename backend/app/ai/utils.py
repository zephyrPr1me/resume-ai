import json
import re
from json_repair import repair_json

def extract_and_repair_json(text: str) -> str:
    """Extracts JSON from the LLM response body and attempts to repair it if there are errors."""
    content = text.strip().lstrip("\ufeff\u200b")


    code_block_match = re.search(r"```(?:json)?\s*\n(.*?)\n```", content, re.DOTALL)
    if code_block_match:
        content = code_block_match.group(1).strip()


    balance = 0
    start = -1
    for i, ch in enumerate(content):
        if ch == "{":
            if start == -1:
                start = i
            balance += 1
        elif ch == "}":
            balance -= 1
            if balance == 0 and start != -1:
                content = content[start : i + 1]
                break

    try:
        json.loads(content)
        return content
    except json.JSONDecodeError:
        pass
    try:
        repaired = repair_json(content)
        json.loads(repaired)
        return repaired
    except Exception:
        return content
