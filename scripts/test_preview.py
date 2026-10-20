"""Run with: python -m unittest discover -s scripts -p test_preview.py"""

import http.client
import tempfile
import threading
import unittest
from pathlib import Path
from http.server import ThreadingHTTPServer

from preview import PreviewHandler, render_page


class PreviewTest(unittest.TestCase):
    def test_routes_templates_and_ranges(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ("_pages", "_layouts", "assets/Apply", "images", "artifacts"):
                (root / name).mkdir(parents=True, exist_ok=True)
            template = root / "_layouts/editorial.html"
            template.write_text(
                "<title>{{ page.title }}</title><main>{{ content }}</main>",
                encoding="utf-8",
            )
            for filename, route, title in (
                ("home", "/", "Home"),
                ("cv", "/cv/", "Resume"),
                ("404", "/404.html", "Missing"),
            ):
                (root / f"_pages/{filename}.md").write_text(
                    f"---\nlayout: editorial\npermalink: {route}\ntitle: {title}\n---\n# {title}\n",
                    encoding="utf-8",
                )
            (root / "assets/audio.mp3").write_bytes(b"0123456789")
            for name in ("assets/Apply/private.txt", "artifacts/private.txt"):
                (root / name).write_text("private", encoding="utf-8")

            class Handler(PreviewHandler):
                def log_message(self, *args):
                    pass

            Handler.root = root
            server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()

            def request(path, method="GET", headers=None):
                connection = http.client.HTTPConnection(*server.server_address, timeout=5)
                try:
                    connection.request(method, path, headers=headers or {})
                    response = connection.getresponse()
                    return response.status, dict(response.headers), response.read()
                finally:
                    connection.close()

            try:
                for path in ("/", "/about", "/about/", "/resume", "/cv/"):
                    status, _, body = request(path)
                    self.assertEqual(status, 200)
                    self.assertIn(b"<h1>", body)
                for path in ("/unknown", "/artifacts/private.txt", "/assets/Apply/private.txt"):
                    status, _, body = request(path)
                    self.assertEqual(status, 404)
                    self.assertIn(b"Missing", body)
                    self.assertNotIn(b"private", body)
                for path in ("/assets/../Gemfile", "/assets/%2e%2e/Gemfile", "/assets/%5c..%5cGemfile", "/assets/Apply.%20/private.txt"):
                    self.assertEqual(request(path)[0], 400)
                self.assertEqual(request("/assets/audio.mp3")[2], b"0123456789")
                for value, expected in (("bytes=2-4", b"234"), ("bytes=-3", b"789"), ("bytes=8-", b"89")):
                    status, headers, body = request("/assets/audio.mp3", headers={"Range": value})
                    self.assertEqual((status, body), (206, expected))
                    self.assertEqual(int(headers["Content-Length"]), len(expected))
                for value in ("bytes=20-", "bytes=-0", "bytes=2-1", "bytes=0-1,4-5"):
                    self.assertEqual(request("/assets/audio.mp3", headers={"Range": value})[0], 416)
                status, headers, body = request("/assets/audio.mp3", "HEAD", {"Range": "bytes=2-4"})
                self.assertEqual((status, headers["Content-Length"], body), (206, "3", b""))
                self.assertEqual(headers["X-Preview-Mode"], "source-preview-not-jekyll")
                template.write_text("{{ site.title }} {{ content }}", encoding="utf-8")
                with self.assertRaises(ValueError):
                    render_page(root, {}, "Body")
            finally:
                server.shutdown()
                server.server_close()
                thread.join()


if __name__ == "__main__":
    unittest.main()
