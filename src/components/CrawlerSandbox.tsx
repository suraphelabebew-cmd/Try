import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Terminal,
  FolderTree,
  Archive,
  CheckCircle,
  FileCode,
  Layers,
  ArrowRight,
  HardDrive,
  Sparkles,
  Zap
} from 'lucide-react';
import { SAMPLE_PRESETS, SitePreset } from '../data/sampleSites';
import { CrawledResource, FileCategory } from '../types';

export const CrawlerSandbox: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('spa-wasm');
  const activePreset = SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) || SAMPLE_PRESETS[0];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(600); // ms per step
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Initialize or reset
  const handleReset = () => {
    setIsRunning(false);
    setCurrentIndex(0);
    setIsFinished(false);
    setLogs([
      `[INIT] Target: ${activePreset.startUrl}`,
      `[INIT] Base Domain: ${activePreset.domain}`,
      `[INIT] Mirror Root: ${activePreset.domain}/`,
      `[INIT] Compression Engine: ZIP (LZMA High-Ratio)`,
      `[QUEUE] Enqueued starting seed URL: ${activePreset.startUrl} (depth 0)`,
      `----------------------------------------------------------------------`,
    ]);
  };

  useEffect(() => {
    handleReset();
  }, [selectedPresetId]);

  // Step function
  const stepCrawl = () => {
    if (currentIndex >= activePreset.resources.length) {
      if (!isFinished) {
        setIsFinished(true);
        setIsRunning(false);
        const totalRaw = activePreset.resources.reduce((acc, r) => acc + r.sizeBytes, 0);
        const compressed = Math.round(totalRaw * 0.22); // ~78% reduction with LZMA on code/web assets
        const savedPercent = ((1 - compressed / totalRaw) * 100).toFixed(1);
        setLogs((prev) => [
          ...prev,
          `----------------------------------------------------------------------`,
          `[COMPLETE] Crawl queue empty. Total resources saved: ${activePreset.resources.length}`,
          `[ARCHIVE] Compressing directory ${activePreset.domain}/ into ${activePreset.domain}_archive.zip...`,
          `[LZMA] Analyzing entropy across HTML, JS, CSS, WASM, and JSON files...`,
          `[SUCCESS] High-Ratio Archive Created!`,
          `          Uncompressed: ${(totalRaw / (1024 * 1024)).toFixed(2)} MB`,
          `          Compressed:   ${(compressed / (1024 * 1024)).toFixed(2)} MB`,
          `          Space Saved:  ${savedPercent}% reduction`,
        ]);
      }
      return;
    }

    const item = activePreset.resources[currentIndex];
    const sizeKb = (item.sizeBytes / 1024).toFixed(1);

    const logEntry = `[✓ 200 OK] (${sizeKb.padStart(6, ' ')} KB) [D:${item.depth}] → ${item.localPath}`;
    const extraLog =
      item.newLinksDiscovered > 0
        ? `         ↳ Enqueued ${item.newLinksDiscovered} new internal resources`
        : null;

    setLogs((prev) => (extraLog ? [...prev, logEntry, extraLog] : [...prev, logEntry]));
    setCurrentIndex((prev) => prev + 1);
  };

  // Auto runner loop
  useEffect(() => {
    let timer: any = null;
    if (isRunning && !isFinished) {
      timer = setTimeout(() => {
        stepCrawl();
      }, speed);
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentIndex, isFinished, speed]);

  // Auto scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Completed items so far
  const completedResources = activePreset.resources.slice(0, currentIndex);
  const totalDownloadedBytes = completedResources.reduce((acc, r) => acc + r.sizeBytes, 0);
  const queueRemaining = Math.max(0, activePreset.resources.length - currentIndex);

  // Asset counts
  const categoryCounts: Record<FileCategory, number> = {
    html: 0,
    javascript: 0,
    stylesheet: 0,
    json: 0,
    image: 0,
    font: 0,
    binary: 0,
    other: 0,
  };
  completedResources.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Live Interactive Crawler Sandbox
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Test and watch the recursive crawler fetch, mirror directories, extract links, and pack high-ratio archives.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPresetId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedPresetId === p.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              disabled={isFinished}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pause Crawl' : isFinished ? 'Crawl Finished' : 'Start Simulation'}</span>
            </button>

            <button
              onClick={stepCrawl}
              disabled={isRunning || isFinished}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Crawl Speed:</span>
            {[
              { label: '0.5x', ms: 1000 },
              { label: '1x', ms: 600 },
              { label: '3x', ms: 250 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setSpeed(s.ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  speed === s.ms ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Files Downloaded</div>
          <div className="text-xl font-bold text-slate-100 mt-1 flex items-baseline gap-1">
            <span>{currentIndex}</span>
            <span className="text-xs text-slate-500">/ {activePreset.resources.length}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${(currentIndex / activePreset.resources.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Raw Mirror Size</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {(totalDownloadedBytes / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div className="text-[10px] text-slate-500 mt-2">Safe binary writes</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Remaining In Queue</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{queueRemaining}</div>
          <div className="text-[10px] text-slate-500 mt-2">BFS recursion queue</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Compression Savings</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {isFinished ? '78.2% Saved' : 'Pending Crawl'}
          </div>
          <div className="text-[10px] text-slate-500 mt-2">ZIP LZMA High-Ratio</div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Terminal Log Console (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[480px]">
          <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Terminal Output Stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isRunning ? 'Crawling...' : isFinished ? 'Completed' : 'Ready'}
              </span>
            </div>
          </div>

          <div
            ref={logContainerRef}
            className="p-4 font-mono text-xs overflow-y-auto flex-1 space-y-1.5 select-text leading-relaxed"
          >
            {logs.map((log, i) => {
              const isSuccess = log.includes('[✓ 200 OK]');
              const isDiscovered = log.includes('Enqueued');
              const isArchive = log.includes('[ARCHIVE]') || log.includes('[SUCCESS]') || log.includes('[LZMA]');
              const isHeader = log.includes('---') || log.includes('[INIT]');

              let color = 'text-slate-300';
              if (isSuccess) color = 'text-emerald-400';
              else if (isDiscovered) color = 'text-cyan-400';
              else if (isArchive) color = 'text-fuchsia-300 font-semibold';
              else if (isHeader) color = 'text-slate-500';

              return (
                <div key={i} className={`${color} whitespace-pre-wrap break-all`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Harvested Assets Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Universal Asset Breakdown
              </h3>
              <span className="text-[11px] text-slate-400">Zero file restrictions</span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { label: 'HTML Documents', key: 'html', color: 'bg-indigo-500', count: categoryCounts.html },
                { label: 'JavaScript Bundles', key: 'javascript', color: 'bg-yellow-500', count: categoryCounts.javascript },
                { label: 'Stylesheets (CSS)', key: 'stylesheet', color: 'bg-cyan-500', count: categoryCounts.stylesheet },
                { label: 'Binary / WASM', key: 'binary', color: 'bg-fuchsia-500', count: categoryCounts.binary },
                { label: 'JSON / Config Data', key: 'json', color: 'bg-emerald-500', count: categoryCounts.json },
                { label: 'Images & Vectors', key: 'image', color: 'bg-purple-500', count: categoryCounts.image },
                { label: 'Web Fonts', key: 'font', color: 'bg-blue-500', count: categoryCounts.font },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`}></span>
                    <span>{item.label}</span>
                  </span>
                  <span className="font-mono text-slate-400 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.count} files
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* High-Ratio Compression Summary Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-fuchsia-950/40 via-indigo-950/40 to-slate-900 border border-fuchsia-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-fuchsia-300">
              <span className="flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-fuchsia-400" />
                High-Ratio Archive Engine
              </span>
              <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-200 px-2 py-0.5 rounded-full">
                ZIP LZMA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When the crawl finishes, the script automatically packs all directories into an ultra-compressed archive, reducing 4.2 MB of web code down to under 900 KB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
