/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ScriptStudio } from './components/ScriptStudio';
import { DirectoryMirrorVisualizer } from './components/DirectoryMirrorVisualizer';
import { CrawlerSandbox } from './components/CrawlerSandbox';
import { LinkParserExplorer } from './components/LinkParserExplorer';
import { CompressionLab } from './components/CompressionLab';
import { ScraperConfig } from './types';
import { Terminal, Shield, FolderTree, Archive, Sparkles } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ScraperConfig>({
    startUrl: 'https://example.com',
    outputDir: '',
    delay: 0.3,
    timeout: 15,
    maxDepth: null,
    maxPages: null,
    compression: 'zip-lzma',
    userAgentPreset: 'chrome',
    customUserAgent: '',
    verifySsl: true,
    parseCss: true,
    parseSrcset: true,
    sanitizeQuery: true,
  });

  const [activeTab, setActiveTab] = useState<string>('script');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Header */}
      <Header config={config} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'script' && <ScriptStudio config={config} setConfig={setConfig} />}
        {activeTab === 'mirror' && <DirectoryMirrorVisualizer />}
        {activeTab === 'sandbox' && <CrawlerSandbox />}
        {activeTab === 'parser' && <LinkParserExplorer />}
        {activeTab === 'compression' && <CompressionLab />}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SiteVault Archiver</span>
            <span>•</span>
            <span>Python 3.8+ Universal Web Scraper & Mirror Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Rate-Limited & Connection Pooled
            </span>
            <span className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5 text-fuchsia-400" />
              ZIP LZMA & TAR.XZ Compression
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
