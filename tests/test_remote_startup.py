import socketserver
import threading
import unittest

from playwright.sync_api import sync_playwright


class _NeverRespondHandler(socketserver.BaseRequestHandler):
    def handle(self):
        self.request.recv(4096)
        threading.Event().wait(30)


class RemoteStartupTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.blackhole = socketserver.ThreadingTCPServer(("127.0.0.1", 0), _NeverRespondHandler)
        cls.blackhole.daemon_threads = True
        cls.port = cls.blackhole.server_address[1]
        cls.thread = threading.Thread(target=cls.blackhole.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.blackhole.shutdown()
        cls.blackhole.server_close()

    def test_unreachable_observer_does_not_block_office_startup(self):
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path="/usr/bin/google-chrome",
                headless=True,
                args=["--no-sandbox"],
            )
            page = browser.new_page()
            observer = f"http://127.0.0.1:{self.port}"
            page.goto(
                f"http://127.0.0.1:5010/?api={observer}",
                wait_until="domcontentloaded",
            )

            page.wait_for_timeout(6500)
            display = page.locator("#loading-overlay").evaluate(
                "element => getComputedStyle(element).display"
            )
            browser.close()

        self.assertEqual(
            display,
            "none",
            "an unreachable observer API must not leave the app on its loading screen",
        )


if __name__ == "__main__":
    unittest.main()
