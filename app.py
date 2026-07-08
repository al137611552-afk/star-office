from flask import Flask, jsonify, make_response, request, send_from_directory
from pathlib import Path
import json
from datetime import datetime

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
DATA = ROOT / "data"
STATE_FILE = DATA / "state.json"
JOIN_KEYS_FILE = DATA / "join-keys.json"

app = Flask(__name__, static_folder=str(FRONTEND), static_url_path="/static")


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
    state = load_json(
        STATE_FILE,
        {
            "state": "idle",
            "detail": "Waiting...",
            "progress": 0,
            "updated_at": datetime.now().isoformat(),
        },
    )
    return jsonify(state)


@app.post("/set_state")
def set_state():
    payload = request.get_json(silent=True) or {}
    state = load_json(
        STATE_FILE,
        {
            "state": "idle",
            "detail": "Waiting...",
            "progress": 0,
            "updated_at": datetime.now().isoformat(),
        },
    )
    if "state" in payload:
        state["state"] = payload["state"]
    if "detail" in payload:
        state["detail"] = payload["detail"]
    state["updated_at"] = datetime.now().isoformat()
    save_json(STATE_FILE, state)
    return jsonify({"ok": True, "state": state})


@app.get("/yesterday-memo")
def yesterday_memo():
    return jsonify(
        {
            "success": True,
            "date": "2026-02-26",
            "memo": "Step 1 scaffold complete.\nPixel baseline locked.\nPalette extracted from source.",
        }
    )


@app.get("/join-keys")
def join_keys():
    return jsonify(load_json(JOIN_KEYS_FILE, {"keys": []}))


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "star-office-ui-remake"})


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(str(FRONTEND / "assets"), "star-idle-v5.png")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
