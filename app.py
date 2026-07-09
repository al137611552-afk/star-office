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

MEMOS = {
    "zh": {
        "date": "2026-02-26",
        "memo": "昨晚把底部状态铭牌重新收口。\n右侧说明栏已改成办公室情报卡。\n下一步继续收紧 memo 卡与操作台的成品感。",
    },
    "en": {
        "date": "2026-02-26",
        "memo": "Last night the bottom status plaque was embedded into the scene.\nThe right notes block became an office info card.\nNext up: tighten the memo card and the control console into a more finished product surface.",
    },
    "ja": {
        "date": "2026-02-26",
        "memo": "昨夜、下部の状態銘板をシーンに馴染ませました。\n右側の説明欄はオフィス情報カードへ変更済みです。\n次はメモカードと操作台の完成度をさらに詰めます。",
    },
}


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
    return jsonify({"ok": True, "service": "star-office-ui-remake"})


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(str(FRONTEND / "assets"), "star-idle-v5.png")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5010, debug=True)
