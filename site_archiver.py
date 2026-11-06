#!/usr/bin/env python3
"""
SiteVault - Universal Website Scraper & Deep Archiver
====================================================
A production-ready recursive website crawler, asset mirrorer, and high-compression
archiver that downloads all files and structures without restriction.

Features:
- Universal Asset Capture: Mirrors any file format (.html, .js, .ts, .css, .json, .wasm, .svg, .png, etc.)
- Deep Link Extraction: Inspects href, src, data-src, srcset, action, poster, and CSS url(...)
- Strict Directory Mirroring: Preserves exact server URL path hierarchy locally
- High-Ratio Compression: Auto-compresses completed mirror into ZIP (LZMA/Deflate-9) or TAR.XZ
- Robust Best-Practices: Connection pooling, automatic retries, rate limiting, and graceful abort
"""

import os
import sys
import re
import time
import random
import argparse
import tarfile
import zipfile
import urllib.parse
from collections import deque
from typing import Set, Tuple, Optional, List

try:
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    from bs4 import BeautifulSoup
except ImportError:
    print("\n[!] Missing required dependencies.")
    print("    Please install them with: pip install requests beautifulsoup4 urllib3\n")
    sys.exit(1)


# Terminal ANSI Colors for clear progress output
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


# Common attributes searched across HTML elements
HTML_URL_ATTRIBUTES = [
    ("a", "href"),
    ("link", "href"),
    ("area", "href"),
    ("script", "src"),
    ("img", "src"),
    ("iframe", "src"),
    ("source", "src"),
    ("video", "src"),
    ("audio", "src"),
    ("embed", "src"),
    ("track", "src"),
    ("input", "src"),
    ("form", "action"),
    ("video", "poster"),
    # Modern lazy loading attributes
    ("*", "data-src"),
    ("*", "data-href"),
    ("*", "data-original"),
    ("*", "data-lazy-src"),
]

# Regex pattern to match url(...) references in CSS
CSS_URL_PATTERN = re.compile(
    r"""url\(\s*(?:['"]?)(.*?)(?:['"]?)\s*\)""", re.IGNORECASE
)


class WebsiteArchiver:
    def __init__(
        self,
        start_url: str,
        output_dir: Optional[str] = None,
        delay: float = 0.3,
        timeout: int = 15,
        max_depth: Optional[int] = None,
        max_pages: Optional[int] = None,
        compression: str = "zip-lzma",
        user_agent: Optional[str] = None,
        verify_ssl: bool = True,
        parse_css: bool = True,
    ):
        # 1. Normalize Starting Target
        parsed = urllib.parse.urlparse(start_url)
        if not parsed.scheme:
            start_url = "https://" + start_url
            parsed = urllib.parse.urlparse(start_url)

        self.start_url = start_url
        self.scheme = parsed.scheme or "https"
        self.base_domain = parsed.netloc.lower()
        if not self.base_domain:
            raise ValueError(f"Could not extract a valid domain from: {start_url}")

        # Base directory named after the domain
        self.root_dir = output_dir or self._sanitize_domain_for_folder(self.base_domain)
        self.delay = max(0.0, delay)
        self.timeout = timeout
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.compression = compression.lower()
        self.verify_ssl = verify_ssl
        self.parse_css = parse_css

        # State tracking
        self.visited_urls: Set[str] = set()
        self.queue: deque = deque()  # stores (url, depth)
        self.total_bytes_downloaded = 0
        self.files_saved_count = 0
        self.failed_urls: List[Tuple[str, str]] = []

        # Setup robust requests Session with retry logic
        self.session = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False,
        )
        adapter = HTTPAdapter(max_retries=retries, pool_connections=10, pool_maxsize=10)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)

        # Realistic modern browser headers
        self.user_agent = user_agent or (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
        self.session.headers.update({
            "User-Agent": self.user_agent,
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        })

    def _sanitize_domain_for_folder(self, domain: str) -> str:
        """Sanitize domain string for local filesystem use."""
        clean = re.sub(r'[:*?"<>|]', "_", domain)
        return clean.strip(". ")

    def _url_to_local_path(self, url: str) -> str:
        """
        Convert a full URL to a strictly mirrored local filesystem path.
        Example:
          https://example.com/assets/css/main.css -> example.com/assets/css/main.css
          https://example.com/blog/ -> example.com/blog/index.html
          https://example.com/ -> example.com/index.html
          https://example.com/about -> example.com/about/index.html (or about.html)
        """
        parsed = urllib.parse.urlparse(url)
        path = parsed.path

        # Handle root or empty path
        if not path or path == "/":
            relative_path = "index.html"
        else:
            # Strip leading slash
            relative_path = path.lstrip("/")

            # If path ends in trailing slash, it's a directory -> append index.html
            if relative_path.endswith("/"):
                relative_path += "index.html"
            else:
                # Check if it has a file extension
                last_segment = relative_path.split("/")[-1]
                if "." not in last_segment:
                    # No extension: save as directory index.html to preserve hierarchical nesting
                    relative_path += "/index.html"

        # If URL has query parameters, append sanitized hash/suffix to avoid collision
        if parsed.query:
            clean_query = re.sub(r'[\\/*?:"<>|&=]', "_", parsed.query)
            if len(clean_query) > 40:
                clean_query = clean_query[:40]
            # Insert before file extension or at end
            dir_name, file_name = os.path.split(relative_path)
            name_parts = file_name.rsplit(".", 1)
            if len(name_parts) == 2:
                new_file_name = f"{name_parts[0]}__q_{clean_query}.{name_parts[1]}"
            else:
                new_file_name = f"{file_name}__q_{clean_query}"
            relative_path = os.path.join(dir_name, new_file_name) if dir_name else new_file_name

        return os.path.join(self.root_dir, relative_path)

    def _is_same_domain(self, target_url: str) -> bool:
        """Verify that target URL belongs strictly to the website base domain."""
        parsed = urllib.parse.urlparse(target_url)
        netloc = parsed.netloc.lower()
        if not netloc:
            return True
        # Strictly match domain or www. prefix variation
        return netloc == self.base_domain or netloc.lstrip("www.") == self.base_domain.lstrip("www.")

    def _normalize_link(self, current_url: str, link: str) -> Optional[str]:
        """Resolve relative links, strip fragments (#), and ignore mailto/tel/javascript."""
        if not link:
            return None
        link = link.strip()

        # Ignore non-http schemes
        if link.startswith(("mailto:", "tel:", "javascript:", "data:", "sms:", "#")):
            return None

        # Resolve relative URL against current page URL
        full_url = urllib.parse.urljoin(current_url, link)

        # Remove URL fragment / hash
        parsed = urllib.parse.urlsplit(full_url)
        normalized = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))

        # Only allow http and https
        if parsed.scheme not in ("http", "https"):
            return None

        return normalized

    def _extract_srcset_urls(self, srcset_val: str) -> List[str]:
        """Extract URLs from HTML5 srcset attribute (e.g. 'img1.png 1x, img2.png 2x')."""
        urls = []
        for candidate in srcset_val.split(","):
            parts = candidate.strip().split()
            if parts:
                urls.append(parts[0])
        return urls

    def _extract_css_urls(self, css_text: str) -> List[str]:
        """Extract URLs found within CSS url(...) expressions."""
        found = []
        for match in CSS_URL_PATTERN.finditer(css_text):
            url = match.group(1).strip()
            if url and not url.startswith("data:"):
                found.append(url)
        return found

    def _extract_all_links(self, current_url: str, content_bytes: bytes, is_html: bool, is_css: bool) -> List[str]:
        """
        Universal link extractor:
        - Inspects all HTML attributes (href, src, srcset, data-src, etc.)
        - Inspects inline style blocks and style attributes
        - Inspects linked CSS files for url(...) assets
        """
        extracted = []

        if is_html:
            try:
                soup = BeautifulSoup(content_bytes, "html.parser")
            except Exception:
                return []

            # 1. Check all standard and modern HTML attributes
            for tag_name, attr_name in HTML_URL_ATTRIBUTES:
                if tag_name == "*":
                    elements = soup.find_all(attrs={attr_name: True})
                else:
                    elements = soup.find_all(tag_name, attrs={attr_name: True})

                for el in elements:
                    val = el.get(attr_name)
                    if isinstance(val, str):
                        link = self._normalize_link(current_url, val)
                        if link:
                            extracted.append(link)

            # 2. Check srcset attributes for high-res images
            for el in soup.find_all(attrs={"srcset": True}):
                srcset_val = el.get("srcset", "")
                for candidate in self._extract_srcset_urls(srcset_val):
                    link = self._normalize_link(current_url, candidate)
                    if link:
                        extracted.append(link)

            # 3. Check inline <style> blocks
            if self.parse_css:
                for style_tag in soup.find_all("style"):
                    if style_tag.string:
                        for css_url in self._extract_css_urls(style_tag.string):
                            link = self._normalize_link(current_url, css_url)
                            if link:
                                extracted.append(link)

            # 4. Check inline style="" attributes
            if self.parse_css:
                for el in soup.find_all(attrs={"style": True}):
                    style_attr = el.get("style", "")
                    for css_url in self._extract_css_urls(style_attr):
                        link = self._normalize_link(current_url, css_url)
                        if link:
                            extracted.append(link)

        elif is_css and self.parse_css:
            try:
                css_text = content_bytes.decode("utf-8", errors="ignore")
                for css_url in self._extract_css_urls(css_text):
                    link = self._normalize_link(current_url, css_url)
                    if link:
                        extracted.append(link)
            except Exception:
                pass

        return extracted

    def crawl(self):
        """Execute recursive BFS crawler, downloading and archiving all resources."""
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*68}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN} SiteVault - Universal Website Scraper & Archiver{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'='*68}{Colors.RESET}")
        print(f"{Colors.BOLD}Target URL:        {Colors.RESET}{self.start_url}")
        print(f"{Colors.BOLD}Base Domain:       {Colors.RESET}{self.base_domain}")
        print(f"{Colors.BOLD}Mirror Directory:  {Colors.RESET}{self.root_dir}/")
        print(f"{Colors.BOLD}Rate Limit Delay:  {Colors.RESET}{self.delay}s")
        print(f"{Colors.BOLD}Compression:       {Colors.RESET}{self.compression.upper()}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'-'*68}{Colors.RESET}\n")

        # Initialize BFS queue with start URL at depth 0
        self.queue.append((self.start_url, 0))
        self.visited_urls.add(self.start_url)

        try:
            while self.queue:
                # Check maximum page limit if set
                if self.max_pages and self.files_saved_count >= self.max_pages:
                    print(f"\n{Colors.YELLOW}[!] Reached max pages limit ({self.max_pages}). Stopping crawl.{Colors.RESET}")
                    break

                current_url, depth = self.queue.popleft()

                # Check maximum depth limit if set
                if self.max_depth is not None and depth > self.max_depth:
                    continue

                # Respectful rate limiting with slight random jitter
                if self.delay > 0:
                    time.sleep(self.delay + random.uniform(0.01, 0.05))

                self._process_url(current_url, depth)

        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}[!] Crawl interrupted by user (Ctrl+C).{Colors.RESET}")
            print(f"    Proceeding directly to archive compression of downloaded files...\n")

        # Crawl summary
        print(f"\n{Colors.BOLD}{Colors.HEADER}{'-'*68}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}Crawl Completed!{Colors.RESET}")
        print(f"  • Files Saved:       {Colors.BOLD}{self.files_saved_count}{Colors.RESET}")
        print(f"  • Raw Size:          {Colors.BOLD}{self._format_bytes(self.total_bytes_downloaded)}{Colors.RESET}")
        print(f"  • Failed Requests:   {len(self.failed_urls)}")
        print(f"{Colors.BOLD}{Colors.HEADER}{'-'*68}{Colors.RESET}\n")

        # Perform High-Ratio Compression
        if self.files_saved_count > 0:
            self.compress_archive()
        else:
            print(f"{Colors.RED}[!] No files were downloaded. Skipping compression.{Colors.RESET}")

    def _process_url(self, current_url: str, depth: int):
        """Fetch, save, and conditionally parse links from a URL."""
        local_path = self._url_to_local_path(current_url)
        rel_display = os.path.relpath(local_path, start=os.getcwd())

        try:
            response = self.session.get(
                current_url,
                timeout=self.timeout,
                verify=self.verify_ssl,
                allow_redirects=True,
            )

            # Skip non-200 responses
            if response.status_code != 200:
                print(f"{Colors.RED}[HTTP {response.status_code}]{Colors.RESET} {current_url} {Colors.DIM}(skipped){Colors.RESET}")
                self.failed_urls.append((current_url, f"HTTP {response.status_code}"))
                return

            # Read raw response content safely (supports binary, code, images, wasm, text)
            content_bytes = response.content
            size_kb = len(content_bytes) / 1024.0

            # Create destination folder structure
            os.makedirs(os.path.dirname(local_path), exist_ok=True)

            # Write file strictly as binary to prevent encoding corruption
            with open(local_path, "wb") as f:
                f.write(content_bytes)

            self.files_saved_count += 1
            self.total_bytes_downloaded += len(content_bytes)

            # Determine content type
            content_type = response.headers.get("Content-Type", "").lower()
            is_html = "text/html" in content_type or "application/xhtml" in content_type or local_path.endswith((".html", ".htm"))
            is_css = "text/css" in content_type or local_path.endswith(".css")

            print(
                f"{Colors.GREEN}[✓ 200 OK]{Colors.RESET} "
                f"{Colors.DIM}({size_kb:>6.1f} KB){Colors.RESET} "
                f"{Colors.BOLD}[D:{depth}]{Colors.RESET} "
                f"→ {rel_display}"
            )

            # Extract further links ONLY from HTML and CSS
            if is_html or is_css:
                discovered_links = self._extract_all_links(response.url, content_bytes, is_html, is_css)
                new_links_count = 0

                for link in discovered_links:
                    if self._is_same_domain(link) and link not in self.visited_urls:
                        self.visited_urls.add(link)
                        self.queue.append((link, depth + 1))
                        new_links_count += 1

                if new_links_count > 0:
                    print(f"         {Colors.CYAN}↳ Enqueued {new_links_count} new internal resources{Colors.RESET}")

        except requests.exceptions.Timeout:
            print(f"{Colors.RED}[TIMEOUT]{Colors.RESET} {current_url}")
            self.failed_urls.append((current_url, "Request Timeout"))
        except requests.exceptions.SSLError as e:
            print(f"{Colors.RED}[SSL ERROR]{Colors.RESET} {current_url}: {e}")
            self.failed_urls.append((current_url, "SSL Verification Failed"))
        except requests.exceptions.RequestException as e:
            print(f"{Colors.RED}[REQUEST ERROR]{Colors.RESET} {current_url}: {e}")
            self.failed_urls.append((current_url, str(e)))
        except OSError as e:
            print(f"{Colors.RED}[FILE I/O ERROR]{Colors.RESET} Could not write {local_path}: {e}")
            self.failed_urls.append((current_url, f"File I/O: {e}"))

    def compress_archive(self):
        """
        Compress the downloaded directory structure into a high-ratio archive.
        Optimized for text, web code, scripts, and media.
        """
        print(f"\n{Colors.BOLD}{Colors.HEADER}Starting High-Ratio Archive Compression...{Colors.RESET}")
        start_time = time.time()

        raw_size = self._get_directory_size(self.root_dir)
        archive_name = f"{self.root_dir}_archive"

        if self.compression in ("zip-lzma", "lzma"):
            # ZIP with LZMA (Python 3.3+ built-in, outstanding ratio on code/text)
            archive_path = f"{archive_name}.zip"
            print(f"Format: {Colors.CYAN}ZIP (LZMA Compression){Colors.RESET}")
            try:
                with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_LZMA) as zip_file:
                    self._add_to_zip(zip_file, self.root_dir)
            except Exception as e:
                print(f"{Colors.YELLOW}[!] LZMA failed ({e}), falling back to ZIP DEFLATE level 9.{Colors.RESET}")
                archive_path = f"{archive_name}_deflate.zip"
                with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zip_file:
                    self._add_to_zip(zip_file, self.root_dir)

        elif self.compression in ("tar-xz", "tar.xz", "xz"):
            # TAR.XZ with maximum preset (extreme compression)
            archive_path = f"{archive_name}.tar.xz"
            print(f"Format: {Colors.CYAN}TAR.XZ (LZMA Extreme Preset){Colors.RESET}")
            with tarfile.open(archive_path, "w:xz", preset=9) as tar:
                tar.add(self.root_dir, arcname=os.path.basename(self.root_dir))

        else:
            # Default: standard ZIP with maximum DEFLATE compression level 9
            archive_path = f"{archive_name}.zip"
            print(f"Format: {Colors.CYAN}ZIP (Deflate Level 9 Maximum){Colors.RESET}")
            with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zip_file:
                self._add_to_zip(zip_file, self.root_dir)

        compressed_size = os.path.getsize(archive_path) if os.path.exists(archive_path) else 0
        ratio = (1.0 - (compressed_size / raw_size)) * 100 if raw_size > 0 else 0.0
        elapsed = time.time() - start_time

        print(f"\n{Colors.BOLD}{Colors.GREEN}{'='*68}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}✓ Archive Created Successfully!{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*68}{Colors.RESET}")
        print(f"  • Archive File:       {Colors.BOLD}{archive_path}{Colors.RESET}")
        print(f"  • Uncompressed Size:  {self._format_bytes(raw_size)}")
        print(f"  • Compressed Size:    {Colors.BOLD}{self._format_bytes(compressed_size)}{Colors.RESET}")
        print(f"  • Space Saved:        {Colors.BOLD}{Colors.GREEN}{ratio:.2f}%{Colors.RESET}")
        print(f"  • Compression Time:   {elapsed:.2f} seconds")
        print(f"{Colors.BOLD}{Colors.GREEN}{'='*68}{Colors.RESET}\n")

    def _add_to_zip(self, zip_file: zipfile.ZipFile, folder_path: str):
        """Recursively add all files in directory to zip with relative archive paths."""
        for root, _, files in os.walk(folder_path):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, start=os.path.dirname(folder_path))
                zip_file.write(full_path, arcname=rel_path)

    def _get_directory_size(self, path: str) -> int:
        """Calculate total size of directory in bytes."""
        total = 0
        for dirpath, _, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp) and os.path.exists(fp):
                    total += os.path.getsize(fp)
        return total

    def _format_bytes(self, size_bytes: int) -> str:
        """Human-readable byte formatting."""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.2f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def main():
    parser = argparse.ArgumentParser(
        description="SiteVault - Universal Recursive Website Scraper & Deep Archiver",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "-u", "--url",
        help="Starting website URL (e.g., https://example.com)",
        required=False,
    )
    parser.add_argument(
        "-o", "--output",
        help="Custom output folder name (defaults to target domain)",
        default=None,
    )
    parser.add_argument(
        "-d", "--delay",
        type=float,
        default=0.3,
        help="Rate-limiting delay between requests in seconds",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=15,
        help="HTTP request timeout in seconds",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=None,
        help="Maximum link recursion depth (default: unlimited)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Maximum total pages/files to download before stopping",
    )
    parser.add_argument(
        "-c", "--compression",
        choices=["zip-lzma", "zip-deflate", "tar-xz"],
        default="zip-lzma",
        help="High-ratio compression format for the final archive",
    )
    parser.add_argument(
        "--user-agent",
        default=None,
        help="Custom HTTP User-Agent string",
    )
    parser.add_argument(
        "--no-ssl-verify",
        action="store_true",
        help="Disable SSL certificate verification (use with caution)",
    )
    parser.add_argument(
        "--no-css-parse",
        action="store_true",
        help="Disable parsing CSS files for url(...) assets",
    )

    args = parser.parse_args()

    # If no URL passed via CLI argument, prompt interactively
    target_url = args.url
    if not target_url:
        print(f"\n{Colors.BOLD}{Colors.CYAN}SiteVault Interactive Setup{Colors.RESET}")
        try:
            target_url = input(f"{Colors.BOLD}Enter target website URL: {Colors.RESET}").strip()
        except EOFError:
            print("\nExiting.")
            sys.exit(0)

    if not target_url:
        print(f"{Colors.RED}[!] Error: Target URL cannot be empty.{Colors.RESET}")
        sys.exit(1)

    try:
        archiver = WebsiteArchiver(
            start_url=target_url,
            output_dir=args.output,
            delay=args.delay,
            timeout=args.timeout,
            max_depth=args.depth if hasattr(args, "depth") else args.max_depth,
            max_pages=args.max_pages,
            compression=args.compression,
            user_agent=args.user_agent,
            verify_ssl=not args.no_ssl_verify,
            parse_css=not args.no_css_parse,
        )
        archiver.crawl()
    except Exception as e:
        print(f"\n{Colors.RED}[!] Fatal Error: {e}{Colors.RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
