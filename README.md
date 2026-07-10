# Star Office UI Remake

Pixel-office dashboard built with Flask, Phaser, and native ES modules. The live panel shows the development server's inferred Hermes activity, Git metadata, running command, changed files, and recent activity timeline.

## Run the frontend locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5010

The checked-in frontend defaults to the development server's read-only observer API:

```text
http://43.131.249.151/star-office-api
```

This means a local copy of the frontend displays Hermes and Git activity from the development server instead of inspecting the local computer. Live status refreshes every 2 seconds and recent activity every 5 seconds. State-control buttons are disabled in observer mode.

## API selection

API resolution order:

1. `?api=<base-url>` query override
2. `<meta name="star-office-api-base">` in `frontend/index.html`
3. Same origin when no base is configured

Use the local backend and re-enable state controls for development:

```text
http://127.0.0.1:5010/?api=same-origin
```

Use another observer endpoint:

```text
http://127.0.0.1:5010/?api=http%3A%2F%2Fexample.test%2Fstar-office-api
```

The public `/star-office-api/` Nginx route permits GET requests only and returns CORS headers for browser access. State mutation remains unavailable through the public observer API.
