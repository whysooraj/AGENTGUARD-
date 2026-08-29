#!/usr/bin/env python3
import sys
import subprocess
import requests
import json
import time

RELAY_URL = "http://127.0.0.1:3000"

def get_risk_score(cmd_str):
    if any(k in cmd_str for k in ["rm -rf", "git push --force", "DROP TABLE", "terraform destroy"]):
        return 96, "CRITICAL"
    if any(k in cmd_str for k in ["chmod", "sudo", "kill -9"]):
        return 65, "HIGH"
    return 15, "LOW"

def main():
    if len(sys.argv) < 2:
        sys.exit(0)

    cmd_args = sys.argv[1:]
    cmd_str = " ".join(cmd_args)
    score, level = get_risk_score(cmd_str)

    print(f"\n🛡️ [AgentGuard Interceptor] Intercepted Real CLI Call: '{cmd_str}'", flush=True)
    print(f"📊 Risk Score: {score}/100 ({level})", flush=True)

    if score < 50:
        print("⚡ [AgentGuard] Low risk command auto-approved. Executing real binary...", flush=True)
        res = subprocess.run(cmd_args)
        sys.exit(res.returncode)

    # High risk command - request approval from backend relay
    print("🔒 [AgentGuard] High risk command detected! Sent to Mobile Guard for approval...", flush=True)
    try:
        req_res = requests.post(f"{RELAY_URL}/api/v1/approval/request", json={
            "device_id": "real-agent-cli",
            "agent_name": "Real-Terminal-Agent",
            "command": cmd_str,
            "risk_score": score,
            "reason": f"Intercepted live real terminal execution of '{cmd_str}'"
        })
        approval_data = req_res.json()
        req_id = approval_data["id"]

        print(f"📱 Please open Mobile Guard to approve ID: {req_id}", flush=True)

        start_time = time.time()
        while time.time() - start_time < 120:
            status_res = requests.get(f"{RELAY_URL}/api/v1/approval/wait/{req_id}")
            if status_res.ok:
                st = status_res.json().get("status")
                if st == "APPROVED":
                    print("✅ [AgentGuard] Biometric approval granted on phone! Executing real binary now...", flush=True)
                    res = subprocess.run(cmd_args)
                    sys.exit(res.returncode)
                elif st == "DENIED":
                    print("🚫 [AgentGuard] Command execution DENIED by user on phone!", flush=True)
                    sys.exit(1)
            time.sleep(1)

        print("⏰ [AgentGuard] Approval TIMEOUT (120s). Execution aborted.", flush=True)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Interceptor error: {e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
