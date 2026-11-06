import React from 'react';
import {
  Archive,
  Download,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  FileCode
} from 'lucide-react';
import { ScraperConfig } from '../types';
import { downloadScraperBundle, downloadSingleFile } from '../utils/bundleExporter';
import { generatePythonScript } from '../utils/codeGenerator';

interface HeaderProps {
  config: ScraperConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ config, activeTab, setActiveTab }) => {
  const [copied, setCopied] = React.useState(false);
  const [downloadingBundle, setDownloadingBundle] = React.useState(false);

  const handleCopy = () => {
    const code = generatePythonScript(config);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const code = generatePythonScript(config);
    downloadSingleFile('site_archiver.py', code, 'text/x-python');
  };

  const handleDownloadBundle = async () => {
    setDownloadingBundle(true);
    try {
      await downloadScraperBundle(config);
    } finally {
      setDownloadingBundle(false);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3.5">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-fuchsia-600 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Archive className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  SiteVault
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Universal Scraper & Archiver
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Recursive website crawler • Universal asset capture • Strict URL hierarchy • High-ratio compression
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Copy python script to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Script!' : 'Copy Script'}</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download site_archiver.py"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download .py</span>
            </button>

            <button
              onClick={handleDownloadBundle}
              disabled={downloadingBundle}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-950/50"
              title="Download complete zip bundle with requirements.txt, README, run.sh and site_archiver.py"
            >
              <Download className="w-3.5 h-3.5 text-cyan-200" />
              <span>{downloadingBundle ? 'Zipping...' : 'Download Bundle (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="py-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Universal File Capture <span className="text-slate-500 text-[11px]">(No extension filters)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Exact URL Mirroring <span className="text-slate-500 text-[11px]">(domain/path/file.ext)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              High-Ratio Compression <span className="text-slate-500 text-[11px]">({config.compression.toUpperCase()})</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Rate-Limited & Resilient
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('script')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'script' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python Script & Studio
            </button>
            <button
              onClick={() => setActiveTab('mirror')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'mirror' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Path Mirroring Visualizer
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'sandbox' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Crawler Sandbox
            </button>
            <button
              onClick={() => setActiveTab('parser')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'parser' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Universal Link Inspector
            </button>
            <button
              onClick={() => setActiveTab('compression')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'compression' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compression Lab
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
