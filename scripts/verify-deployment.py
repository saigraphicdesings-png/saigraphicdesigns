"""Check the newly published catalogue, allowing time for edge propagation."""
import os
import time
import urllib.request

base = "https://saigraphicdesigns.sai-graphic-designspagesdev.workers.dev"
version = os.environ.get("GITHUB_SHA", "catalog-check")
checks = [
    ("/shop", 'id="allProducts"', True),
    ("/", 'id="homeServicesGrid"', True),
    ("/bundle-sitemap.xml", "<urlset", False),
    ("/cdr-bundles", "CorelDRAW (CDR) Design Bundles", False),
    ("/free-cdr-files", "Free CorelDRAW (CDR) Files", False),
]
for path, marker, rendered in checks:
    for attempt in range(6):
        try:
            with urllib.request.urlopen(base + path + "?deployment=" + version, timeout=20) as response:
                html = response.read().decode("utf-8")
                assert marker in html, "Expected page content is missing"
                if rendered:
                    assert response.headers.get("x-catalog-rendered") == "1", "Catalogue renderer did not run"
            print("Verified", path)
            break
        except Exception as error:
            if attempt == 5:
                raise RuntimeError("Verification failed for " + path) from error
            print("Retrying", path, str(error))
            time.sleep(5)
