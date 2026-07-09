#!/usr/bin/env python3
from pathlib import Path
import argparse
import json
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
MANUAL_OVERRIDE_FILE = DATA / "manual-override.json"


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_json(path: Path):
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def main():
    parser = argparse.ArgumentParser(description="Manage Star Office live developer status override")
    sub = parser.add_subparsers(dest="command", required=True)

    show = sub.add_parser("show", help="Show current manual override payload")
    show.set_defaults(command="show")

    clear = sub.add_parser("clear", help="Clear manual override")
    clear.set_defaults(command="clear")

    set_cmd = sub.add_parser("set", help="Set manual override using one detail for all locales")
    set_cmd.add_argument("state", choices=["idle", "writing", "researching", "executing", "syncing", "error"])
    set_cmd.add_argument("detail")
    set_cmd.add_argument("--ttl", type=int, default=300, help="Override TTL in seconds")

    set_i18n = sub.add_parser("set-i18n", help="Set manual override with per-locale details")
    set_i18n.add_argument("state", choices=["idle", "writing", "researching", "executing", "syncing", "error"])
    set_i18n.add_argument("--zh", required=True)
    set_i18n.add_argument("--en", required=True)
    set_i18n.add_argument("--ja", required=True)
    set_i18n.add_argument("--ttl", type=int, default=300, help="Override TTL in seconds")

    args = parser.parse_args()

    if args.command == "show":
        print(json.dumps(load_json(MANUAL_OVERRIDE_FILE), ensure_ascii=False, indent=2))
        return

    if args.command == "clear":
        save_json(MANUAL_OVERRIDE_FILE, {})
        print("cleared")
        return

    expires_at = (datetime.now() + timedelta(seconds=max(10, min(args.ttl, 3600)))).isoformat(timespec="seconds")

    if args.command == "set":
        detail_i18n = {"zh": args.detail, "en": args.detail, "ja": args.detail}
        detail = args.detail
    else:
        detail_i18n = {"zh": args.zh, "en": args.en, "ja": args.ja}
        detail = args.en

    payload = {
        "state": args.state,
        "detail": detail,
        "detail_i18n": detail_i18n,
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "manual_until": expires_at,
        "source": "manual-override",
        "mode": "manual",
        "progress": 0,
    }
    save_json(MANUAL_OVERRIDE_FILE, payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
