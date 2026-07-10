from flask import Flask, jsonify, make_response, request, send_from_directory
from pathlib import Path
import json
import subprocess
from datetime import datetime, timedelta

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
DATA = ROOT / "data"
MANUAL_OVERRIDE_FILE = DATA / "manual-override.json"
JOIN_KEYS_FILE = DATA / "join-keys.json"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="/static")

MEMOS = {
    "zh": {
        "date": "2026-02-26",
        "memo": "昨晚把状态桥接接进页面。\n右侧说明栏已经升级成办公室情报卡。\n下一步继续压缩文案层级，并把它收成更像直播面板的成品。",
    },
    "en": {
        "date": "2026-02-26",
        "memo": "Last night the live status bridge was wired into the page.\nThe right notes block has already become an office info card.\nNext up: compress the copy hierarchy and make it feel more like a live status dashboard.",
    },
    "ja": {
        "date": "2026-02-26",
        "memo": "昨夜、ライブ状態ブリッジをページへ接続しました。\n右側の説明欄はすでにオフィス情報カードへ更新済みです。\n次は文言の階層を圧縮し、より配信中の状態パネルらしく整えます。"
    },
}

STATE_LABELS = {
    "idle": {"zh": "待命", "en": "Idle", "ja": "待機"},
    "writing": {"zh": "工作", "en": "Work", "ja": "作業"},
    "researching": {"zh": "搜索信息", "en": "Researching", "ja": "情報検索"},
    "executing": {"zh": "执行任务", "en": "Executing", "ja": "実行中"},
    "syncing": {"zh": "同步", "en": "Sync", "ja": "同期"},
    "error": {"zh": "报警", "en": "Alert", "ja": "警報"},
}

STATE_ORDER = {"idle": 0, "researching": 1, "writing": 2, "executing": 3, "syncing": 4, "error": 5}


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def run_command(command: list[str]) -> str:
    try:
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=4)
        if result.returncode != 0:
            return ""
        return result.stdout.rstrip()
    except Exception:
        return ""


def run_git(*args: str) -> str:
    return run_command(["git", *args])


def get_branch() -> str:
    return run_git("branch", "--show-current") or "master"


def parse_git_status():
    raw = run_git("status", "--porcelain", "--untracked-files=all")
    rows = []
    ignored_paths = {"data/manual-override.json"}
    for line in raw.splitlines():
        if len(line) < 4:
            continue
        path = line[3:]
        if path in ignored_paths or path.startswith("__pycache__/"):
            continue
        rows.append({"code": line[:2], "path": path})
    return rows


def get_last_commit():
    output = run_git("log", "-1", "--format=%H\n%s\n%ct")
    lines = output.splitlines()
    if len(lines) < 3:
        return {"sha": "", "subject": "", "timestamp": None, "age_seconds": None}
    try:
        commit_dt = datetime.fromtimestamp(int(lines[2]))
        age_seconds = max(0, int((datetime.now() - commit_dt).total_seconds()))
    except Exception:
        commit_dt = None
        age_seconds = None
    return {
        "sha": lines[0],
        "subject": lines[1],
        "timestamp": commit_dt.isoformat(timespec="seconds") if commit_dt else None,
        "age_seconds": age_seconds,
    }


def detect_running_dev_command():
    output = run_command(["ps", "-eo", "pid=,etimes=,args="])
    if not output:
        return None

    keywords = (
        "pytest",
        "npm ",
        "pnpm ",
        "yarn ",
        "vite",
        "webpack",
        "npx ",
        "ruff ",
        "mypy ",
        "python -m",
        "python3 -m",
        "uv run",
        "git add",
        "git commit",
        "git push",
    )
    ignore_snippets = (
        "app.py",
        "ps -eo",
        "grep ",
        "tail ",
        "sleep ",
        "bash -lc",
        "hermes_cli.main gateway run",
        "hermes gateway run",
    )

    best = None
    for line in output.splitlines():
        parts = line.strip().split(None, 2)
        if len(parts) != 3:
            continue
        pid, etimes, cmd = parts
        lowered = cmd.lower()
        if any(snippet in lowered for snippet in ignore_snippets):
            continue
        if not any(keyword in lowered for keyword in keywords):
            continue

        state = "executing"
        if "git add" in lowered or "git commit" in lowered or "git push" in lowered:
            state = "syncing"
        elif "pytest" in lowered or "ruff" in lowered or "mypy" in lowered or "npm " in lowered or "pnpm " in lowered or "yarn " in lowered or "vite" in lowered or "webpack" in lowered or "npx " in lowered or "uv run" in lowered or "python -m" in lowered:
            state = "executing"

        cleaned = " ".join(cmd.split())
        candidate = {
            "pid": int(pid),
            "age_seconds": int(etimes),
            "state": state,
            "command": cleaned[:160],
        }
        if best is None or candidate["age_seconds"] < best["age_seconds"]:
            best = candidate
    return best


def file_mtime_iso(relative_path: str):
    try:
        return datetime.fromtimestamp((ROOT / relative_path).stat().st_mtime).isoformat(timespec="seconds")
    except Exception:
        return None


def build_detail_bundle(state: str, **kwargs):
    if state == "writing":
        path = kwargs.get("path") or "workspace"
        count = kwargs.get("count") or 1
        if count == 1:
            return {
                "zh": f"正在修改 {path}",
                "en": f"Editing {path}",
                "ja": f"{path} を編集中",
            }
        return {
            "zh": f"正在修改 {path} 等 {count} 个文件",
            "en": f"Editing {path} and {count - 1} more files",
            "ja": f"{path} など {count} 件を編集中",
        }

    if state == "researching":
        topic = kwargs.get("topic") or "context"
        return {
            "zh": f"正在整理 {topic} 的上下文",
            "en": f"Collecting context for {topic}",
            "ja": f"{topic} の文脈を収集中",
        }

    if state == "executing":
        command = kwargs.get("command") or "development command"
        return {
            "zh": f"正在执行：{command}",
            "en": f"Running: {command}",
            "ja": f"実行中: {command}",
        }

    if state == "syncing":
        subject = kwargs.get("subject") or "latest changes"
        return {
            "zh": f"最近提交：{subject}",
            "en": f"Recent commit: {subject}",
            "ja": f"直近のコミット: {subject}",
        }

    if state == "error":
        message = kwargs.get("message") or "issue detected"
        return {
            "zh": f"检测到问题：{message}",
            "en": f"Issue detected: {message}",
            "ja": f"問題を検知: {message}",
        }

    return {
        "zh": "等待下一步开发指令",
        "en": "Waiting for the next development task",
        "ja": "次の開発タスクを待機中",
    }


def normalize_status_payload(payload: dict, source: str, mode: str):
    state = payload.get("state") or "idle"
    if state not in STATE_LABELS:
        state = "idle"

    detail_i18n = payload.get("detail_i18n") or build_detail_bundle(state)
    detail = payload.get("detail") or detail_i18n.get("en") or detail_i18n.get("zh") or detail_i18n.get("ja") or ""

    branch = payload.get("branch") or get_branch()
    changed_files = payload.get("changed_files") or []
    last_commit = payload.get("last_commit") or get_last_commit()

    normalized = {
        "state": state,
        "detail": detail,
        "detail_i18n": detail_i18n,
        "progress": int(payload.get("progress", 0) or 0),
        "updated_at": payload.get("updated_at") or now_iso(),
        "source": source,
        "mode": mode,
        "branch": branch,
        "state_labels": STATE_LABELS[state],
        "changed_files": changed_files,
        "changed_file_count": int(payload.get("changed_file_count", len(changed_files))),
        "last_commit": last_commit,
        "manual_until": payload.get("manual_until"),
        "running_command": payload.get("running_command"),
    }
    return normalized


def get_manual_override():
    payload = load_json(MANUAL_OVERRIDE_FILE, {})
    if not payload:
        return None
    manual_until_raw = payload.get("manual_until")
    if not manual_until_raw:
        return None
    try:
        manual_until = datetime.fromisoformat(manual_until_raw)
    except Exception:
        return None
    if manual_until <= datetime.now():
        return None
    return normalize_status_payload(payload, source="manual-override", mode="manual")


def infer_auto_status():
    branch = get_branch()
    dirty_rows = parse_git_status()
    dirty_paths = [row["path"] for row in dirty_rows]
    running_command = detect_running_dev_command()
    last_commit = get_last_commit()

    if running_command:
        detail_i18n = build_detail_bundle(running_command["state"], command=running_command["command"])
        return normalize_status_payload(
            {
                "state": running_command["state"],
                "detail": detail_i18n["en"],
                "detail_i18n": detail_i18n,
                "updated_at": now_iso(),
                "branch": branch,
                "changed_files": dirty_paths,
                "changed_file_count": len(dirty_paths),
                "last_commit": last_commit,
                "running_command": running_command,
            },
            source="auto-process",
            mode="auto",
        )

    if dirty_paths:
        latest_path = max(
            dirty_paths,
            key=lambda item: (ROOT / item).stat().st_mtime if (ROOT / item).exists() else 0,
        )
        detail_i18n = build_detail_bundle("writing", path=latest_path, count=len(dirty_paths))
        return normalize_status_payload(
            {
                "state": "writing",
                "detail": detail_i18n["en"],
                "detail_i18n": detail_i18n,
                "updated_at": file_mtime_iso(latest_path) or now_iso(),
                "branch": branch,
                "changed_files": dirty_paths,
                "changed_file_count": len(dirty_paths),
                "last_commit": last_commit,
            },
            source="auto-git-dirty",
            mode="auto",
        )

    if last_commit.get("age_seconds") is not None and last_commit["age_seconds"] <= 900:
        detail_i18n = build_detail_bundle("syncing", subject=last_commit.get("subject") or "latest changes")
        return normalize_status_payload(
            {
                "state": "syncing",
                "detail": detail_i18n["en"],
                "detail_i18n": detail_i18n,
                "updated_at": last_commit.get("timestamp") or now_iso(),
                "branch": branch,
                "changed_files": [],
                "changed_file_count": 0,
                "last_commit": last_commit,
            },
            source="auto-recent-commit",
            mode="auto",
        )

    detail_i18n = build_detail_bundle("idle")
    return normalize_status_payload(
        {
            "state": "idle",
            "detail": detail_i18n["en"],
            "detail_i18n": detail_i18n,
            "updated_at": now_iso(),
            "branch": branch,
            "changed_files": [],
            "changed_file_count": 0,
            "last_commit": last_commit,
        },
        source="auto-idle",
        mode="auto",
    )


def get_live_status():
    manual = get_manual_override()
    if manual:
        return manual
    return infer_auto_status()


@app.after_request
def no_cache(resp):
    if request.path.startswith("/static/"):
        resp.headers["Cache-Control"] = "public, max-age=3600"
    else:
        resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    return resp


@app.get("/")
def index():
    html = (FRONTEND / "index.html").read_text(encoding="utf-8")
    return make_response(html)


@app.get("/status")
def status():
    return jsonify(get_live_status())


@app.get("/dev-status")
def dev_status():
    return jsonify({"ok": True, "status": get_live_status()})


@app.post("/set_state")
def set_state():
    payload = request.get_json(silent=True) or {}
    state = payload.get("state") or "idle"
    if state not in STATE_LABELS:
        state = "idle"

    ttl_seconds = int(payload.get("ttl_seconds") or 300)
    ttl_seconds = max(10, min(ttl_seconds, 3600))
    manual_until = (datetime.now() + timedelta(seconds=ttl_seconds)).isoformat(timespec="seconds")

    detail_i18n = payload.get("detail_i18n")
    if not detail_i18n:
        detail_i18n = build_detail_bundle(state, path=payload.get("path"), topic=payload.get("topic"), command=payload.get("detail"), subject=payload.get("detail"), message=payload.get("detail"))

    dirty_paths = [row["path"] for row in parse_git_status()]
    manual_payload = normalize_status_payload(
        {
            "state": state,
            "detail": payload.get("detail") or detail_i18n.get("en") or detail_i18n.get("zh") or detail_i18n.get("ja") or "",
            "detail_i18n": detail_i18n,
            "progress": int(payload.get("progress", 0) or 0),
            "updated_at": now_iso(),
            "manual_until": manual_until,
            "branch": get_branch(),
            "changed_files": dirty_paths,
            "changed_file_count": len(dirty_paths),
            "last_commit": get_last_commit(),
        },
        source="manual-override",
        mode="manual",
    )
    save_json(MANUAL_OVERRIDE_FILE, manual_payload)
    return jsonify({"ok": True, "status": manual_payload})


@app.post("/clear_state")
def clear_state():
    save_json(MANUAL_OVERRIDE_FILE, {})
    return jsonify({"ok": True, "status": get_live_status()})


@app.get("/yesterday-memo")
def yesterday_memo():
    lang = (request.args.get("lang") or "zh").lower()
    if lang not in MEMOS:
        lang = "zh"
    payload = MEMOS[lang]
    return jsonify(
        {
            "success": True,
            "lang": lang,
            "date": payload["date"],
            "memo": payload["memo"],
        }
    )


@app.get("/join-keys")
def join_keys():
    return jsonify(load_json(JOIN_KEYS_FILE, {"keys": []}))


@app.get("/health")
def health():
    status = get_live_status()
    return jsonify({"ok": True, "service": "star-office-ui-remake", "mode": status["mode"], "state": status["state"]})


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(str(FRONTEND / "assets"), "star-idle-v5.png")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
