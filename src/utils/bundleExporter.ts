import JSZip from 'jszip';
import { ScraperConfig } from '../types';
import { generatePythonScript } from './codeGenerator';

export async function downloadScraperBundle(config: ScraperConfig) {
  const zip = new JSZip();

  const pythonScript = generatePythonScript(config);

  const requirementsTxt = `requests>=2.31.0
beautifulsoup4>=4.12.3
urllib3>=2.0.0
`;

  const runSh = `#!/usr/bin/env bash
# Quick-start script for SiteVault Scraper
echo "[*] Installing Python dependencies..."
pip install -r requirements.txt

echo "[*] Launching SiteVault Scraper..."
python site_archiver.py --url "${config.startUrl || 'https://example.com'}"
`;

  const runBat = `@echo off
echo [*] Installing Python dependencies...
pip install -r requirements.txt

echo [*] Launching SiteVault Scraper...
python site_archiver.py --url "${config.startUrl || 'https://example.com'}"
pause
`;

  const readmeMd = `# SiteVault Website Scraper & Archiver

This archive contains your tailored recursive website scraper and archiver.

## Contents:
- \`site_archiver.py\` - Main Python script
- \`requirements.txt\` - Dependencies (requests, beautifulsoup4, urllib3)
- \`run.sh\` - Linux/macOS launcher
- \`run.bat\` - Windows launcher

## Quick Start:
1. Open a terminal in this directory.
2. Run:
   \`\`\`bash
   pip install -r requirements.txt
   python site_archiver.py --url ${config.startUrl || 'https://example.com'}
   \`\`\`
3. The script will mirror the entire website structure to a local folder named after the domain, then compress it into a high-ratio archive.
`;

  zip.file('site_archiver.py', pythonScript);
  zip.file('requirements.txt', requirementsTxt);
  zip.file('run.sh', runSh);
  zip.file('run.bat', runBat);
  zip.file('README.md', readmeMd);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitevault_scraper_bundle.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSingleFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
