import tempfile
import unittest
from pathlib import Path

import app as app_module


class ActivityHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_file = app_module.ACTIVITY_HISTORY_FILE
        self.original_limit = app_module.ACTIVITY_HISTORY_LIMIT
        app_module.ACTIVITY_HISTORY_FILE = Path(self.temp_dir.name) / "activity-history.json"
        app_module.ACTIVITY_HISTORY_LIMIT = 40

    def tearDown(self):
        app_module.ACTIVITY_HISTORY_FILE = self.original_file
        app_module.ACTIVITY_HISTORY_LIMIT = self.original_limit
        self.temp_dir.cleanup()

    @staticmethod
    def status(state, detail):
        return {
            "state": state,
            "detail": detail,
            "detail_i18n": {"zh": detail, "en": detail, "ja": detail},
            "mode": "auto",
            "source": "test",
            "branch": "master",
            "changed_files": [],
            "changed_file_count": 0,
            "running_command": None,
            "last_commit": {},
            "state_labels": app_module.STATE_LABELS[state],
        }

    def test_deduplicates_consecutive_activity(self):
        idle = self.status("idle", "waiting")
        writing = self.status("writing", "editing app.py")

        app_module.record_activity(idle)
        app_module.record_activity(idle)
        app_module.record_activity(writing)

        history = app_module.read_activity_history(8)
        self.assertEqual(history["count"], 2)
        self.assertEqual([item["state"] for item in history["items"]], ["writing", "idle"])
        self.assertNotIn("_signature", history["items"][0])

    def test_keeps_only_configured_history_limit(self):
        app_module.ACTIVITY_HISTORY_LIMIT = 3
        for index in range(5):
            app_module.record_activity(self.status("writing", f"edit {index}"))

        history = app_module.read_activity_history(20)
        self.assertEqual(history["count"], 3)
        self.assertEqual([item["detail"] for item in history["items"]], ["edit 4", "edit 3", "edit 2"])

    def test_history_endpoint_respects_limit(self):
        app_module.record_activity(self.status("idle", "waiting"))
        app_module.record_activity(self.status("syncing", "recent commit"))

        client = app_module.app.test_client()
        response = client.get("/activity-history?limit=1")
        payload = response.get_json()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["items"][0]["state"], "syncing")


if __name__ == "__main__":
    unittest.main()
