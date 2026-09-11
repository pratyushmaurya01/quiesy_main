import logging
import os
import time
import requests

logger = logging.getLogger(__name__)

# Execution Endpoints
JUDGE0_API_URL = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com").rstrip("/")
JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "")
JUDGE0_API_HOST = os.getenv("JUDGE0_API_HOST", "judge0-ce.p.rapidapi.com")
PISTON_API_URL = os.getenv("PISTON_API_URL", "https://emkc.org/api/v2/piston").rstrip("/")

# Language mapping for Judge0
# Reference: https://ce.judge0.com/languages
JUDGE0_LANGUAGE_MAP = {
    "python": 71,       # Python (3.8.1)
    "python3": 71,
    "py": 71,
    "javascript": 63,   # JavaScript (Node.js 12.14.0)
    "js": 63,
    "cpp": 54,          # C++ (GCC 9.2.0)
    "c++": 54,
    "c": 50,            # C (GCC 9.2.0)
    "java": 62,         # Java (OpenJDK 13.0.1)
}

# Language mapping for Piston (fallback)
PISTON_LANGUAGE_MAP = {
    "python": ("python", "3.10.0"),
    "python3": ("python", "3.10.0"),
    "py": ("python", "3.10.0"),
    "javascript": ("javascript", "18.15.0"),
    "js": ("javascript", "18.15.0"),
    "cpp": ("c++", "10.2.0"),
    "c++": ("c++", "10.2.0"),
    "c": ("c", "10.2.0"),
    "java": ("java", "15.0.2"),
}


def _get_judge0_headers():
    headers = {"Content-Type": "application/json"}
    if JUDGE0_API_KEY:
        headers["X-RapidAPI-Key"] = JUDGE0_API_KEY
        headers["X-RapidAPI-Host"] = JUDGE0_API_HOST
    return headers


def _normalize_output(text: str) -> str:
    """Normalize output for consistent comparison across platforms"""
    if not text:
        return ""
    # Replace CRLF with LF, strip trailing spaces from lines, and strip outer whitespace
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").replace("\r", "\n").strip().split("\n")]
    return "\n".join(lines).strip()


def run_code_single(code: str, language: str, stdin: str = ""):
    """
    Execute single snippet with stdin and return:
    {
       'stdout': str,
       'stderr': str,
       'compile_output': str,
       'time': float,
       'memory': int,
       'status': str,
       'success': bool,
    }
    """
    normalized_lang = str(language or "python").lower().strip()
    lang_id = JUDGE0_LANGUAGE_MAP.get(normalized_lang, 71)

    payload = {
        "source_code": code,
        "language_id": lang_id,
        "stdin": stdin or "",
    }

    try:
        url = f"{JUDGE0_API_URL}/submissions/?wait=true"
        resp = requests.post(url, json=payload, headers=_get_judge0_headers(), timeout=12)
        if resp.status_code in [200, 201]:
            data = resp.json()
            status_desc = data.get("status", {}).get("description", "Completed")
            stdout = data.get("stdout") or ""
            stderr = data.get("stderr") or ""
            compile_output = data.get("compile_output") or ""
            error_msg = stderr or compile_output or data.get("message") or ""

            return {
                "stdout": stdout,
                "stderr": error_msg,
                "status": status_desc,
                "time": data.get("time"),
                "memory": data.get("memory"),
                "success": data.get("status", {}).get("id") == 3,
            }
    except Exception as e:
        logger.warning(f"Judge0 single execution failed: {e}. Falling back to Piston.")

    return _run_piston(code, normalized_lang, stdin)


def run_code_batch(code: str, language: str, test_cases: list):
    """
    Execute code against a batch of test cases:
    test_cases: [{'input_data': str, 'expected_output': str, 'id': any, 'is_sample': bool}, ...]
    Returns list of evaluated results for each testcase.
    """
    if not test_cases:
        return []

    normalized_lang = str(language or "python").lower().strip()
    lang_id = JUDGE0_LANGUAGE_MAP.get(normalized_lang, 71)

    submissions = [
        {
            "source_code": code,
            "language_id": lang_id,
            "stdin": tc.get("input_data", "") or "",
            "expected_output": tc.get("expected_output", "") or "",
        }
        for tc in test_cases
    ]

    try:
        url = f"{JUDGE0_API_URL}/submissions/batch"
        resp = requests.post(url, json={"submissions": submissions}, headers=_get_judge0_headers(), timeout=15)

        if resp.status_code in [200, 201]:
            batch_tokens = resp.json()
            tokens = [item["token"] for item in batch_tokens if "token" in item]

            if tokens:
                tokens_str = ",".join(tokens)
                for _ in range(6):
                    time.sleep(1.0)
                    poll_url = f"{JUDGE0_API_URL}/submissions/batch?tokens={tokens_str}"
                    poll_resp = requests.get(poll_url, headers=_get_judge0_headers(), timeout=10)
                    if poll_resp.status_code == 200:
                        poll_data = poll_resp.json()
                        sub_results = poll_data.get("submissions", [])

                        still_running = any(
                            s.get("status", {}).get("id") in [1, 2]
                            for s in sub_results
                        )
                        if not still_running and len(sub_results) == len(test_cases):
                            evaluated = []
                            for idx, sub in enumerate(sub_results):
                                original_tc = test_cases[idx]
                                stdout_raw = sub.get("stdout") or ""
                                expected_raw = original_tc.get("expected_output") or ""
                                stdout = _normalize_output(stdout_raw)
                                expected = _normalize_output(expected_raw)
                                stderr = sub.get("stderr") or sub.get("compile_output") or sub.get("message") or ""
                                status_obj = sub.get("status", {})
                                status_id = status_obj.get("id")

                                is_passed = (status_id == 3) or (not stderr and stdout == expected)

                                evaluated.append({
                                    "test_case_id": original_tc.get("id"),
                                    "is_sample": original_tc.get("is_sample", False),
                                    "passed": is_passed,
                                    "status": "Accepted" if is_passed else status_obj.get("description", "Failed"),
                                    "input": original_tc.get("input_data", ""),
                                    "expected_output": expected_raw.strip(),
                                    "actual_output": stdout_raw.strip(),
                                    "error": stderr,
                                    "time": sub.get("time"),
                                })
                            return evaluated

    except Exception as e:
        logger.warning(f"Judge0 batch execution failed: {e}. Falling back to sequential execution.")

    # Fallback: sequential execution via run_code_single
    results = []
    for tc in test_cases:
        res = run_code_single(code, normalized_lang, tc.get("input_data", ""))
        stdout_raw = res.get("stdout") or ""
        expected_raw = tc.get("expected_output") or ""
        stdout = _normalize_output(stdout_raw)
        expected = _normalize_output(expected_raw)
        stderr = res.get("stderr") or ""
        is_passed = (stdout == expected) and not stderr

        results.append({
            "test_case_id": tc.get("id"),
            "is_sample": tc.get("is_sample", False),
            "passed": is_passed,
            "status": "Accepted" if is_passed else ("Error" if stderr else "Wrong Answer"),
            "input": tc.get("input_data", ""),
            "expected_output": expected_raw.strip(),
            "actual_output": stdout_raw.strip(),
            "error": stderr,
            "time": res.get("time"),
        })

    return results


def _run_piston(code: str, language: str, stdin: str = ""):
    piston_lang = PISTON_LANGUAGE_MAP.get(language, ("python", "3.10.0"))
    payload = {
        "language": piston_lang[0],
        "version": piston_lang[1],
        "files": [{"content": code}],
        "stdin": stdin or "",
    }
    try:
        resp = requests.post(f"{PISTON_API_URL}/execute", json=payload, timeout=10)
        if resp.status_code == 200:
            res_json = resp.json()
            run_data = res_json.get("run", {})
            stdout = run_data.get("stdout") or ""
            stderr = run_data.get("stderr") or ""
            code_exit = run_data.get("code", 0)

            return {
                "stdout": stdout,
                "stderr": stderr,
                "status": "Accepted" if code_exit == 0 and not stderr else "Error",
                "time": None,
                "memory": None,
                "success": code_exit == 0 and not stderr,
            }
    except Exception as e:
        logger.error(f"Piston execution failed: {e}")

    return {
        "stdout": "",
        "stderr": "Code execution engine is temporarily unavailable.",
        "status": "Execution Error",
        "time": None,
        "memory": None,
        "success": False,
    }
