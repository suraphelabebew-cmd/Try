import React, { useState } from 'react';
import {
  FileCode,
  Sliders,
  Copy,
  Check,
  Download,
  Terminal,
  Shield,
  Layers,
  Archive,
  Search,
  ExternalLink,
  Info,
  RefreshCw,
  Folder,
  Clock,
  Sparkles
} from 'lucide-react';
import { ScraperConfig, CompressionFormat } from '../types';
import { generatePythonScript } from '../utils/codeGenerator';
import { downloadSingleFile, downloadScraperBundle } from '../utils/bundleExporter';

interface ScriptStudioProps {
  config: ScraperConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScraperConfig>>;
}

export const ScriptStudio: React.FC<ScriptStudioProps> = ({ config, setConfig }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'script' | 'requirements' | 'readme'>('script');

  const pythonCode = generatePythonScript(config);

  const requirementsText = `requests>=2.31.0
beautifulsoup4>=4.12.3
urllib3>=2.0.0
`;

  const readmeText = `# SiteVault - Universal Website Scraper & Deep Archiver

A production-ready Python script for deep recursive website mirroring, universal code
and asset harvesting, directory structure preservation, and high-ratio archive compression.

## Requirements
pip install requests beautifulsoup4 urllib3

## Quick Launch
python site_archiver.py --url ${config.startUrl || 'https://example.com'} --delay ${config.delay} --compression ${config.compression}
`;

  // Generate equivalent CLI command
  const cliCommand = `python site_archiver.py --url "${config.startUrl || 'https://example.com'}" ${
    config.delay !== 0.3 ? `--delay ${config.delay}` : ''
  } ${config.outputDir ? `--output "${config.outputDir}"` : ''} ${
    config.compression !== 'zip-lzma' ? `--compression ${config.compression}` : ''
  } ${config.maxDepth !== null ? `--max-depth ${config.maxDepth}` : ''} ${
    config.maxPages !== null ? `--max-pages ${config.maxPages}` : ''
  } ${!config.verifySsl ? '--no-ssl-verify' : ''} ${!config.parseCss ? '--no-css-parse' : ''}`.replace(/\s+/g, ' ').trim();

  const handleCopyCode = () => {
    const textToCopy =
      activeSubTab === 'script' ? pythonCode : activeSubTab === 'requirements' ? requirementsText : readmeText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Filter or highlight lines
  const lines = (
    activeSubTab === 'script' ? pythonCode : activeSubTab === 'requirements' ? requirementsText : readmeText
  ).split('\n');

  return (
    <div className="space-y-6">
      {/* CLI Command Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="overflow-hidden min-w-0">
            <div className="text-xs text-slate-400 font-medium">Ready-to-Run CLI Command:</div>
            <div className="font-mono text-sm text-cyan-300 truncate bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800/80 mt-1 select-all">
              {cliCommand}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={handleCopyCli}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCli ? 'Copied CLI!' : 'Copy Command'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Configuration Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Scraper Configuration
              </h3>
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                Live Code Sync
              </span>
            </div>

            {/* Target URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Starting Website URL</span>
                <span className="text-[11px] text-slate-500">Auto domain detection</span>
              </label>
              <input
                type="text"
                value={config.startUrl}
                onChange={(e) => setConfig({ ...config, startUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Output Directory */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>Output Folder Name</span>
                <span className="text-[11px] text-slate-500">Default: domain name</span>
              </label>
              <input
                type="text"
                value={config.outputDir}
                onChange={(e) => setConfig({ ...config, outputDir: e.target.value })}
                placeholder="Leave blank for automatic domain folder"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Compression Engine */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-fuchsia-400" />
                  High-Ratio Compression
                </span>
                <span className="text-[11px] text-fuchsia-400 font-medium">Auto-packs on complete</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'zip-lzma' as CompressionFormat,
                    name: 'ZIP (LZMA)',
                    desc: 'Python built-in LZMA. Highest reduction on code & text (65-85%).',
                    badge: 'Recommended',
                  },
                  {
                    id: 'tar-xz' as CompressionFormat,
                    name: 'TAR.XZ (Preset 9)',
                    desc: 'Extreme Unix/Linux archive with maximum compression preset.',
                    badge: 'Extreme',
                  },
                  {
                    id: 'zip-deflate' as CompressionFormat,
                    name: 'ZIP (Deflate Level 9)',
                    desc: 'Maximum compatibility across all OS file explorers.',
                    badge: 'Standard',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConfig({ ...config, compression: item.id })}
                    className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      config.compression === item.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-100'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{item.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          config.compression === item.id
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rate Limiting & Delay */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Rate-Limiting Delay:
                </span>
                <span className="font-mono text-cyan-400 font-semibold">{config.delay.toFixed(2)}s</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="2.0"
                step="0.05"
                value={config.delay}
                onChange={(e) => setConfig({ ...config, delay: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.0s (Fast/Local)</span>
                <span>0.3s (Respectful)</span>
                <span>2.0s (Stealth)</span>
              </div>
            </div>

            {/* Limits: Depth & Max Pages */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Max Depth Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxDepth ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxDepth: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="Unlimited"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Max Total Files</label>
                <input
                  type="number"
                  min="1"
                  value={config.maxPages ?? ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      maxPages: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                  placeholder="Unlimited"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* User Agent Selector */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300">User-Agent Header</label>
              <select
                value={config.userAgentPreset}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    userAgentPreset: e.target.value as any,
                  })
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="chrome">Chrome 124 Desktop (Anti-blocking)</option>
                <option value="firefox">Firefox 125 Desktop</option>
                <option value="bot">SiteVaultArchiver/1.0 (Identified Bot)</option>
                <option value="custom">Custom User-Agent</option>
              </select>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Parse CSS for url(...) assets
                </span>
                <input
                  type="checkbox"
                  checked={config.parseCss}
                  onChange={(e) => setConfig({ ...config, parseCss: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Verify SSL Certificates
                </span>
                <input
                  type="checkbox"
                  checked={config.verifySsl}
                  onChange={(e) => setConfig({ ...config, verifySsl: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
              </label>
            </div>

            {/* Universal Capture Note */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed">
              <span className="font-semibold block text-emerald-200 mb-0.5">✓ Universal Asset Capture Active</span>
              Captures all file types (.html, .js, .wasm, .json, .css, .svg, .png, .pdf, .config, etc.) without restriction or extension filtering.
            </div>
          </div>
        </div>

        {/* Right: Code Viewer & Files (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
            {/* Top Toolbar */}
            <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveSubTab('script')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeSubTab === 'script'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  site_archiver.py
                  <span className="text-[10px] bg-indigo-900/60 px-1.5 py-0.2 rounded text-indigo-200">
                    {pythonCode.split('\n').length} lines
                  </span>
                </button>

                <button
                  onClick={() => setActiveSubTab('requirements')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeSubTab === 'requirements'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  requirements.txt
                </button>

                <button
                  onClick={() => setActiveSubTab('readme')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeSubTab === 'readme'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  README.md
                </button>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in code..."
                    className="bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                  />
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copy current file contents"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => {
                    if (activeSubTab === 'script') {
                      downloadSingleFile('site_archiver.py', pythonCode, 'text/x-python');
                    } else if (activeSubTab === 'requirements') {
                      downloadSingleFile('requirements.txt', requirementsText, 'text/plain');
                    } else {
                      downloadSingleFile('README.md', readmeText, 'text/markdown');
                    }
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Download selected file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body with Line Numbers */}
            <div className="bg-slate-950 font-mono text-xs text-slate-300 p-4 overflow-x-auto max-h-[640px] overflow-y-auto leading-relaxed select-text">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const matches = searchQuery && line.toLowerCase().includes(searchQuery.toLowerCase());
                return (
                  <div
                    key={idx}
                    className={`flex items-start ${matches ? 'bg-indigo-950/60 text-indigo-200' : 'hover:bg-slate-900/50'}`}
                  >
                    <span className="w-12 text-slate-600 text-right pr-4 shrink-0 select-none text-[11px]">
                      {lineNum}
                    </span>
                    <span className="whitespace-pre flex-1">
                      {/* Simple highlighting for comments and defs */}
                      {line.trim().startsWith('#') || line.trim().startsWith('"""') ? (
                        <span className="text-slate-500 italic">{line}</span>
                      ) : line.includes('def ') || line.includes('class ') ? (
                        <span className="text-cyan-400 font-semibold">{line}</span>
                      ) : line.includes('import ') || line.includes('from ') ? (
                        <span className="text-indigo-400">{line}</span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3">
            <h4 className="font-semibold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              How to Run Locally in 3 Steps:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-indigo-400 font-bold mb-1">1. Install Dependencies</div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-1.5 rounded">
                  pip install requests beautifulsoup4 urllib3
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-cyan-400 font-bold mb-1">2. Run the Script</div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-1.5 rounded truncate">
                  python site_archiver.py -u {config.startUrl || 'https://example.com'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-fuchsia-400 font-bold mb-1">3. Access Archive</div>
                <div className="text-[11px] text-slate-400">
                  Folder <code className="text-slate-200">example.com/</code> and compressed archive are saved in current directory.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
