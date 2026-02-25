#!/usr/bin/env python3
"""
Drift Detector — compares terraform plan JSON output to detect infrastructure drift.

Usage:
    # Generate plan JSON first:
    terraform plan -out=plan.tfplan
    terraform show -json plan.tfplan > plan.json

    # Run detector:
    python drift_detector.py --plan-json plan.json

    # Compare against a saved baseline:
    python drift_detector.py --plan-json plan.json --baseline baseline.json

Requirements: None (stdlib only)
"""

import json
import sys
import argparse
from pathlib import Path


CHANGE_ACTIONS = {
    ("no-op",): "UNCHANGED",
    ("create",): "ADDED",
    ("update",): "CHANGED",
    ("delete",): "DESTROYED",
    ("delete", "create"): "REPLACED",
    ("create", "delete"): "REPLACED",
    ("read",): "READ",
}


def classify_action(actions: list) -> str:
    key = tuple(actions)
    return CHANGE_ACTIONS.get(key, f"UNKNOWN({','.join(actions)})")


def parse_plan(plan_json_path: str) -> list[dict]:
    with open(plan_json_path) as f:
        plan = json.load(f)

    resource_changes = plan.get("resource_changes", [])
    results = []
    for rc in resource_changes:
        actions = rc.get("change", {}).get("actions", ["no-op"])
        classification = classify_action(actions)
        if classification == "UNCHANGED":
            continue
        results.append({
            "address": rc.get("address"),
            "type": rc.get("type"),
            "name": rc.get("name"),
            "module": rc.get("module_address"),
            "action": classification,
            "before": rc.get("change", {}).get("before"),
            "after": rc.get("change", {}).get("after"),
        })
    return results


def remediation_hint(action: str, address: str) -> str:
    hints = {
        "DESTROYED": f"  → Remediate: Restore resource or add `lifecycle {{ prevent_destroy = true }}` to {address}",
        "REPLACED": f"  → Review: Replacement causes downtime. Consider `create_before_destroy` lifecycle.",
        "ADDED": f"  → Info: New resource. Verify intentional.",
        "CHANGED": f"  → Review: In-place update. Check if change is expected.",
    }
    return hints.get(action, "")


def main():
    parser = argparse.ArgumentParser(description="Terraform Drift Detector")
    parser.add_argument("--plan-json", required=True, help="Path to terraform show -json output")
    parser.add_argument("--baseline", help="Optional: previous plan JSON to diff against")
    args = parser.parse_args()

    drifts = parse_plan(args.plan_json)

    if not drifts:
        print("No drift detected. Infrastructure matches desired state.")
        sys.exit(0)

    severity_order = ["DESTROYED", "REPLACED", "CHANGED", "ADDED", "READ"]
    drifts.sort(key=lambda d: severity_order.index(d["action"]) if d["action"] in severity_order else 99)

    destroyed = [d for d in drifts if d["action"] == "DESTROYED"]
    replaced = [d for d in drifts if d["action"] == "REPLACED"]
    changed = [d for d in drifts if d["action"] == "CHANGED"]
    added = [d for d in drifts if d["action"] == "ADDED"]

    print(f"\n{'='*60}")
    print(f"Drift Report")
    print(f"Destroyed: {len(destroyed)} | Replaced: {len(replaced)} | Changed: {len(changed)} | Added: {len(added)}")
    print(f"{'='*60}\n")

    for d in drifts:
        module_str = f" [{d['module']}]" if d.get("module") else ""
        print(f"[{d['action']:10}] {d['address']}{module_str}")
        hint = remediation_hint(d["action"], d["address"])
        if hint:
            print(hint)
        print()

    exit_code = 1 if (destroyed or replaced) else 0
    if exit_code:
        print(f"ACTION REQUIRED: {len(destroyed)} destroyed, {len(replaced)} replaced resource(s).")
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
