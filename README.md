# SiteVault: Universal Recursive Website Scraper & Archiver

A production-ready Python script for deep recursive website mirroring, universal code and asset harvesting, directory structure preservation, and high-ratio archive compression.

---

## 🚀 Quick Start

### 1. Requirements & Installation

Requires Python 3.8+ and standard scraping libraries:

```bash
pip install -r requirements.txt
```

Or manually:
```bash
pip install requests beautifulsoup4 urllib3
```

*(Note: `zipfile`, `tarfile`, `lzma`, `urllib.parse`, `argparse` are included directly in Python's standard library!)*

---

## 💻 Running the Scraper

### Interactive Mode
Run the script without arguments and it will prompt you for the target website:
```bash
python site_archiver.py
```

### Command Line Flags
```bash
# Basic mirror with auto domain detection and LZMA ZIP compression
python site_archiver.py --url https://example.com

# Faster crawl with 0.1s delay, capped at 500 files
python site_archiver.py --url https://docs.example.com --delay 0.1 --max-pages 500

# Extreme compression using TAR.XZ with maximum preset 9
python site_archiver.py --url https://example.com --compression tar-xz

# Custom output directory and max recursion depth
python site_archiver.py --url https://example.com --output my_mirror --max-depth 4
```

---

## 🛠️ CLI Options Reference

| Option | Flag | Description | Default |
|--------|------|-------------|---------|
| `--url` | `-u` | Target website starting URL | Prompts if omitted |
| `--output` | `-o` | Custom folder for downloaded files | Target domain name |
| `--delay` | `-d` | Rate-limiting delay between requests (seconds) | `0.3` |
| `--timeout` | | HTTP timeout per request (seconds) | `15` |
| `--max-depth` | | Recursion depth limit (BFS levels) | `None` (unlimited) |
| `--max-pages` | | Maximum total files to download | `None` (unlimited) |
| `--compression`| `-c` | Compression engine: `zip-lzma`, `zip-deflate`, `tar-xz` | `zip-lzma` |
| `--user-agent` | | Custom User-Agent header string | Chrome 124 desktop |
| `--no-ssl-verify` | | Disable TLS certificate checks | `False` |
| `--no-css-parse` | | Skip extracting `url(...)` inside CSS files | `False` |

---

## 🧩 Architectural Highlights

1. **Universal Asset & Code Capture**:
   - Zero extension filtering. Downloads HTML, JS, TS, CSS, JSON, WASM, SVG, PNG, WebP, PDF, XML, and any other file format.
   - Comprehensive link parser inspects `href`, `src`, `data-src`, `data-href`, `data-original`, `data-lazy-src`, `action`, `srcset`, `poster`, and CSS `url(...)`.

2. **Generic Content Handling**:
   - Treats all downloaded content as raw binary bytes (`response.content`) to prevent encoding failures or parsing crashes on binary/script assets.
   - Only HTML and XML are passed to BeautifulSoup for recursive link discovery.

3. **Strict Directory Hierarchy**:
   - `https://example.com/folder/sub/script.js` maps precisely to `example.com/folder/sub/script.js`.
   - Root `/` and trailing slash directories map to `index.html`.
   - Query string URLs are sanitized and mapped to prevent collisions or invalid OS characters.

4. **High-Ratio Compression**:
   - Uses Python's built-in `zipfile.ZIP_LZMA` or `tarfile (w:xz, preset=9)`.
   - Drastically compresses text, code, JavaScript bundles, and markup (typically 65% - 85% size reduction).
