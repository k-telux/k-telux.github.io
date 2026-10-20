"""Local source preview for editorial pages; this is not a Jekyll build."""

import argparse
import html
import mimetypes
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

import yaml
from markdown_it import MarkdownIt


ROOT = Path(__file__).resolve().parents[1]
TOKENS = re.compile(r"{{\s*(content|page\.(?:title|kicker|lede|permalink))\s*}}")
MARKDOWN = MarkdownIt("commonmark", {"html": True}).enable("table")


def request_path(url):
    """Reject ambiguous Windows paths before mapping any request to a file."""
    path = unquote(urlsplit(url).path, errors="strict")
    if not path.startswith("/") or any(c in path for c in "\\:\0"):
        raise ValueError("Invalid path")
    if any(ord(c) < 32 for c in path) or any(
        part.startswith(".") or part.endswith((".", " "))
        for part in path.split("/") if part
    ):
        raise ValueError("Invalid path")
    return path


def canonical(path):
    return path.rstrip("/") or "/"


def read_page(path):
    text = path.read_text(encoding="utf-8-sig")
    pieces = re.split(r"(?m)^---[ \t]*\r?$", text, maxsplit=2)
    if len(pieces) != 3 or pieces[0].strip():
        raise ValueError("Missing YAML front matter")
    metadata = yaml.safe_load(pieces[1])
    if not isinstance(metadata, dict):
        raise ValueError("Invalid page metadata")
    return metadata, pieces[2]


def render_page(root, metadata, body):
    template = (root / "_layouts" / "editorial.html").read_text(encoding="utf-8")
    values = {
        "content": MARKDOWN.render(body),
        **{
            f"page.{name}": html.escape(str(metadata.get(name, "")), quote=True)
            for name in ("title", "kicker", "lede", "permalink")
        },
    }
    result = TOKENS.sub(lambda match: values[match[1]], template)
    if "{{" in result or "{%" in result:
        raise ValueError("Unsupported Liquid: use native Jekyll to render this page")
    return result.encode("utf-8")


def page_for(root, route):
    # ponytail: scan this small page collection per request for live edits;
    # cache an mtime-index only if the collection grows enough to slow preview.
    route = {"/about": "/", "/about.html": "/", "/resume": "/cv"}.get(route, route)
    for source in sorted((root / "_pages").glob("*.md")):
        metadata, body = read_page(source)
        if metadata.get("layout") != "editorial":
            continue
        permalink = request_path(str(metadata.get("permalink", "")))
        if canonical(permalink) == route:
            return render_page(root, metadata, body)
    return None


def static_file(root, path):
    parts = path.lstrip("/").split("/")
    if parts[0] not in ("assets", "images"):
        return None
    if parts[0] == "assets" and any(part.lower() == "apply" for part in parts[1:]):
        return None
    directory = (root / parts[0]).resolve()
    candidate = (root / path.lstrip("/")).resolve()
    if not candidate.is_relative_to(directory) or not candidate.is_file():
        return None
    return candidate


def byte_range(header, size):
    """Return a single inclusive byte range; reject invalid/multipart ranges."""
    match = re.fullmatch(r"bytes=(\d*)-(\d*)", header.strip())
    if not match or not any(match.groups()) or size == 0:
        raise ValueError("Unsatisfiable byte range")
    first, last = match.groups()
    if first:
        start, end = int(first), min(int(last), size - 1) if last else size - 1
    else:
        start, end = max(0, size - int(last)), size - 1
    if start > end or start >= size:
        raise ValueError("Unsatisfiable byte range")
    return start, end


class PreviewHandler(BaseHTTPRequestHandler):
    root = ROOT

    def do_HEAD(self):
        self.do_GET()

    def send_headers(self, status, content_type, length, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Preview-Mode", "source-preview-not-jekyll")
        for name, value in (extra or {}).items():
            self.send_header(name, value)
        self.end_headers()

    def respond(self, status, body):
        self.send_headers(status, "text/html; charset=utf-8", len(body))
        if self.command != "HEAD":
            self.wfile.write(body)

    def not_found(self):
        body = page_for(self.root, "/404.html")
        self.respond(
            404,
            body or b'<!doctype html><title>Page not found</title>'
            b'<h1>Page not found</h1><p><a href="/">Return home</a></p>',
        )

    def do_GET(self):
        try:
            path = request_path(self.path)
            source = static_file(self.root, path)
            if source:
                self.serve_file(source)
                return
            body = page_for(self.root, canonical(path))
            if body is not None:
                self.respond(404 if canonical(path) == "/404.html" else 200, body)
            else:
                self.not_found()
        except (ValueError, UnicodeError):
            self.respond(400, b"<h1>Invalid request or unsupported source template</h1>")
        except (BrokenPipeError, ConnectionResetError):
            pass
        except (OSError, yaml.YAMLError):
            self.respond(500, b"<h1>Source preview could not read this page</h1>")

    def serve_file(self, source):
        with source.open("rb") as stream:
            size = stream.seek(0, 2)
            start, end, status = 0, size - 1, 200
            extra = {"Accept-Ranges": "bytes"}
            if self.headers.get("Range"):
                try:
                    start, end = byte_range(self.headers["Range"], size)
                except ValueError:
                    self.send_headers(416, "text/plain", 0, {"Content-Range": f"bytes */{size}"})
                    return
                status = 206
                extra["Content-Range"] = f"bytes {start}-{end}/{size}"
            length = end - start + 1
            self.send_headers(status, mimetypes.guess_type(source)[0] or "application/octet-stream", length, extra)
            if self.command == "HEAD":
                return
            stream.seek(start)
            remaining = length
            while remaining:
                chunk = stream.read(min(65536, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4000)
    args = parser.parse_args()
    with ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler) as server:
        print(f"Source preview (NOT Jekyll): http://127.0.0.1:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
