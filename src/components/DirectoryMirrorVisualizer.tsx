import React, { useState } from 'react';
import {
  FolderTree,
  Folder,
  File,
  FileCode,
  FileText,
  Image,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Hash,
  Globe,
  Binary
} from 'lucide-react';
import { getFileCategory } from '../data/sampleSites';

interface SampleUrl {
  url: string;
  label: string;
  description: string;
}

const SAMPLE_URLS: SampleUrl[] = [
  {
    url: 'https://www.example.com/main-folder/sub-folder/file.js',
    label: 'Standard Nested Script',
    description: 'Direct deep path hierarchy mirroring strictly down to file.js',
  },
  {
    url: 'https://example.com/',
    label: 'Root URL',
    description: 'Root domain path maps directly to index.html',
  },
  {
    url: 'https://example.com/docs/api/v2/',
    label: 'Trailing Slash Directory',
    description: 'Directory paths ending with slash map to folder/index.html',
  },
  {
    url: 'https://example.com/about',
    label: 'Extension-less Route',
    description: 'Clean routes map to about/index.html to preserve folder hierarchy',
  },
  {
    url: 'https://example.com/assets/wasm/physics_sim.wasm',
    label: 'Universal Binary (WASM)',
    description: 'Binary asset saved directly without parsing to prevent corruption',
  },
  {
    url: 'https://example.com/api/v1/config.json?version=latest&region=us',
    label: 'URL with Query Parameters',
    description: 'Query string sanitized into suffix to prevent Windows/Linux path errors',
  },
  {
    url: 'https://example.com/static/media/icons.svg',
    label: 'Vector Graphics (SVG)',
    description: 'Captured cleanly via universal extension logic',
  },
];

export const DirectoryMirrorVisualizer: React.FC = () => {
  const [inputUrl, setInputUrl] = useState<string>('https://www.example.com/main-folder/sub-folder/file.js');
  const [selectedSample, setSelectedSample] = useState<string>('Standard Nested Script');

  // Compute transformation steps
  let parsedDomain = 'example.com';
  let parsedPath = '/';
  let parsedQuery = '';
  let localPath = '';
  let category = 'other';
  let isHtml = false;
  let handlerStrategy = '';
  let filename = '';
  let extension = '';

  try {
    const raw = inputUrl.startsWith('http') ? inputUrl : 'https://' + inputUrl;
    const urlObj = new URL(raw);
    parsedDomain = urlObj.hostname.toLowerCase();
    parsedPath = urlObj.pathname;
    parsedQuery = urlObj.search;

    let relativePath = '';
    if (!parsedPath || parsedPath === '/') {
      relativePath = 'index.html';
      filename = 'index.html';
      extension = '.html';
    } else {
      relativePath = parsedPath.replace(/^\/+/, '');
      if (relativePath.endsWith('/')) {
        relativePath += 'index.html';
        filename = 'index.html';
        extension = '.html';
      } else {
        const lastPart = relativePath.split('/').pop() || '';
        if (!lastPart.includes('.')) {
          relativePath += '/index.html';
          filename = 'index.html';
          extension = '.html';
        } else {
          filename = lastPart;
          const extMatch = lastPart.match(/\.([a-zA-Z0-9_-]+)$/);
          extension = extMatch ? `.${extMatch[1]}` : '';
        }
      }
    }

    if (parsedQuery) {
      const cleanQ = parsedQuery.replace(/^[?]/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const parts = relativePath.split('.');
      if (parts.length > 1) {
        const ext = parts.pop();
        relativePath = `${parts.join('.')}__q_${cleanQ}.${ext}`;
      } else {
        relativePath = `${relativePath}__q_${cleanQ}`;
      }
    }

    localPath = `${parsedDomain}/${relativePath}`;
    category = getFileCategory(extension);
    isHtml = ['html', 'htm'].includes(extension.replace('.', ''));

    if (isHtml) {
      handlerStrategy = 'HTML Document: Save raw binary, then parse via BeautifulSoup for internal links';
    } else if (category === 'stylesheet') {
      handlerStrategy = 'CSS Stylesheet: Save raw bytes, scan regex url(...) for background images & fonts';
    } else {
      handlerStrategy = 'Universal Asset: Direct binary write via response.content (zero parsing overhead)';
    }
  } catch (e) {
    localPath = 'Invalid URL';
  }

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-indigo-400" />
              Directory Structure & URL Hierarchy Preservation Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Demonstrates exact 1-to-1 mirroring of web paths to local filesystem folders without losing nested structure.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Rule #3: Strict URL Mirroring
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Zero Extension Restrictions
            </span>
          </div>
        </div>

        {/* URL Input Bar */}
        <div className="mt-4 space-y-2">
          <div className="relative">
            <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setSelectedSample('');
              }}
              placeholder="Enter any URL (e.g. https://www.example.com/main-folder/sub-folder/file.js)"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-500 mr-1">Quick Test Presets:</span>
            {SAMPLE_URLS.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setInputUrl(s.url);
                  setSelectedSample(s.label);
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  selectedSample === s.label
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Path Transformation Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Inbound URL */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              Step 1 • Target URL Breakdown
            </div>
            <div className="font-mono text-xs text-slate-200 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              {inputUrl}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Base Domain:</span>
                <span className="font-mono text-cyan-300 font-semibold">{parsedDomain}</span>
              </div>
              <div className="flex justify-between">
                <span>URL Path:</span>
                <span className="font-mono text-slate-300">{parsedPath || '/'}</span>
              </div>
              {parsedQuery && (
                <div className="flex justify-between">
                  <span>Query Params:</span>
                  <span className="font-mono text-yellow-300 truncate max-w-[140px]">{parsedQuery}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Content Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[11px] font-semibold text-fuchsia-400 uppercase tracking-wider mb-1">
              Step 2 • Content Handling Strategy
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 uppercase">
                {category}
              </span>
              <span className="text-xs font-mono text-slate-300">{extension || 'none'}</span>
            </div>
            <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              {handlerStrategy}
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500">
            Rule #2: Non-HTML files bypass BeautifulSoup to prevent decoding errors.
          </div>
        </div>

        {/* Step 3: Local Filesystem Target */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Step 3 • Mirrored Local Path
            </div>
            <div className="font-mono text-xs text-emerald-300 break-all bg-slate-950 p-2.5 rounded-lg border border-emerald-500/30">
              {localPath}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Root Directory:</span>
                <span className="font-mono text-slate-200">{parsedDomain}/</span>
              </div>
              <div className="flex justify-between">
                <span>File Name:</span>
                <span className="font-mono text-slate-200">{filename}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Automatic folder creation via <code className="font-mono">os.makedirs</code>
          </div>
        </div>
      </div>

      {/* Simulated Mirrored Tree Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            Live Mirrored Filesystem Hierarchy Preview
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {parsedDomain}/
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
          {/* Root Folder */}
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Folder className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            <span>{parsedDomain}/</span>
            <span className="text-[10px] text-slate-500 font-normal">(Mirror Root Directory)</span>
          </div>

          {/* Child Levels */}
          <div className="pl-6 border-l border-slate-800 space-y-2">
            {/* Index file */}
            <div className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-900/60">
              <span className="flex items-center gap-2 text-slate-200">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>index.html</span>
              </span>
              <span className="text-[11px] text-slate-500">HTML Document • 14.2 KB</span>
            </div>

            {/* Folder 1: assets */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300">
                <Folder className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                <span>assets/</span>
              </div>
              <div className="pl-6 border-l border-slate-800 space-y-1">
                <div className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-slate-900/60">
                  <span className="flex items-center gap-2 text-slate-300">
                    <FileCode className="w-3.5 h-3.5 text-yellow-400" />
                    <span>app.bundle.js</span>
                  </span>
                  <span className="text-[11px] text-slate-500">JavaScript • 412 KB</span>
                </div>
                <div className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-slate-900/60">
                  <span className="flex items-center gap-2 text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>style.min.css</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Stylesheet • 68 KB</span>
                </div>
                <div className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-slate-900/60">
                  <span className="flex items-center gap-2 text-fuchsia-300">
                    <Binary className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>engine.wasm</span>
                  </span>
                  <span className="text-[11px] text-slate-500">WebAssembly • 1.8 MB</span>
                </div>
              </div>
            </div>

            {/* Current Target Highlight */}
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="break-all">{localPath}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 uppercase font-bold shrink-0">
                Mirrored
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
