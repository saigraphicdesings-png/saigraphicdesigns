"""Check the newly published catalogue, allowing time for edge propagation."""
import os
import time
import subprocess
import tempfile
from pathlib import Path

base = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev"
version = os.environ.get("GITHUB_SHA", "catalog-check")
checks = [
    ("/api/promotion", '"promotion"', False),
    ("/admin", 'id="promotionPanel"', False),
    ("/shop", 'id="allProducts"', True),
    ("/", 'id="homeServicesGrid"', True),
    ("/bundle-sitemap.xml", "<urlset", False),
    ("/cdr-bundles", "CorelDRAW (CDR) Design Bundles", False),
    ("/free-cdr-files", "Free CorelDRAW (CDR) Files", False),
]
for path, marker, rendered in checks:
    for attempt in range(6):
        try:
            with tempfile.TemporaryDirectory() as directory:
                headers, body = Path(directory) / "headers", Path(directory) / "body"
                subprocess.run(["curl", "--fail", "--silent", "--show-error", "--location",
                    "--max-redirs", "5", "--max-time", "20", "--dump-header", str(headers),
                    "--output", str(body), base + path + "?deployment=" + version], check=True)
                html = body.read_text()
                assert marker in html, "Expected page content is missing"
                if rendered:
                    assert "x-catalog-rendered: 1" in headers.read_text().lower(), "Catalogue renderer did not run"
            print("Verified", path)
            break
        except Exception as error:
            if attempt == 5:
                raise RuntimeError("Verification failed for " + path) from error
            print("Retrying", path, str(error))
            time.sleep(5)
