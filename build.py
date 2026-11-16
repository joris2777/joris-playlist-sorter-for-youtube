"""Build store-ready zips: one for Chrome/Edge, one for Firefox.

Usage: python build.py
"""
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
FILES = ["manifest.json", "content.js", "content.css",
         "icons/icon16.png", "icons/icon48.png", "icons/icon128.png"]

# Firefox needs an add-on ID and a data-collection declaration.
FIREFOX_SETTINGS = {
    "gecko": {
        "id": "joris-playlist-sorter-for-youtube@extension",
        "strict_min_version": "140.0",
        "data_collection_permissions": {"required": ["none"]},
    }
}


def build(target, manifest):
    folder = DIST / target
    shutil.rmtree(folder, ignore_errors=True)
    for name in FILES:
        dest = folder / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, dest)
    (folder / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    zip_path = DIST / f"joris-playlist-sorter-{target}-{manifest['version']}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in FILES:
            zf.write(folder / name, name)  # forward-slash paths, as the stores require
    print(f"Built {zip_path.relative_to(ROOT)}")


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    DIST.mkdir(exist_ok=True)
    build("chrome", manifest)
    build("firefox", {**manifest, "browser_specific_settings": FIREFOX_SETTINGS})


if __name__ == "__main__":
    main()
