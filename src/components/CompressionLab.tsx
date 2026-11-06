import React, { useState } from 'react';
import {
  Archive,
  Cpu,
  Layers,
  Sparkles,
  HardDrive,
  CheckCircle2,
  Zap,
  Info,
  ArrowDownRight
} from 'lucide-react';

export const CompressionLab: React.FC = () => {
  const [uncompressedSizeMb, setUncompressedSizeMb] = useState<number>(45);
  const [profile, setProfile] = useState<'code' | 'mixed' | 'media'>('code');

  // Reduction ratios based on real benchmarks
  // Code (HTML/JS/CSS/JSON/WASM): LZMA saves ~80%, XZ saves ~82%, Deflate-9 saves ~68%
  // Mixed: LZMA saves ~62%, Deflate saves ~52%
  // Media (already compressed PNG/WebP/MP4): LZMA saves ~18%, Deflate saves ~12%
  const ratios = {
    code: { lzma: 0.19, xz: 0.17, deflate: 0.31, bzip2: 0.24 },
    mixed: { lzma: 0.38, xz: 0.35, deflate: 0.48, bzip2: 0.42 },
    media: { lzma: 0.82, xz: 0.80, deflate: 0.88, bzip2: 0.85 },
  };

  const currentRatios = ratios[profile];

  const lzmaSize = (uncompressedSizeMb * currentRatios.lzma).toFixed(1);
  const xzSize = (uncompressedSizeMb * currentRatios.xz).toFixed(1);
  const deflateSize = (uncompressedSizeMb * currentRatios.deflate).toFixed(1);
  const bzip2Size = (uncompressedSizeMb * currentRatios.bzip2).toFixed(1);

  const lzmaSavedPct = ((1 - currentRatios.lzma) * 100).toFixed(1);
  const xzSavedPct = ((1 - currentRatios.xz) * 100).toFixed(1);
  const deflateSavedPct = ((1 - currentRatios.deflate) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Archive className="w-5 h-5 text-fuchsia-400" />
          High-Ratio Archive Compression Benchmarks & Physics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Requirement #4: Automatically compresses the mirrored website into an ultra-compact archive optimized for code, scripts, and markup.
        </p>
      </div>

      {/* Interactive Size Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Interactive Archive Size & Space-Savings Calculator
          </h3>
          {/* Site Profile Selection */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] text-slate-500 px-2">Site Profile:</span>
            {[
              { id: 'code' as const, label: 'Code & WebApp (JS/WASM/HTML)' },
              { id: 'mixed' as const, label: 'Mixed Portal' },
              { id: 'media' as const, label: 'Media Heavy' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile(p.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  profile === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Slider */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Uncompressed Downloaded Directory Size:</span>
            <span className="text-base font-mono font-bold text-cyan-300">{uncompressedSizeMb} MB</span>
          </div>
          <input
            type="range"
            min="2"
            max="300"
            step="1"
            value={uncompressedSizeMb}
            onChange={(e) => setUncompressedSizeMb(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>2 MB (Small landing page)</span>
            <span>45 MB (Standard web app mirror)</span>
            <span>300 MB (Large documentation portal)</span>
          </div>
        </div>

        {/* Compression Engine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* ZIP LZMA */}
          <div className="bg-slate-950/80 border-2 border-indigo-500/60 rounded-xl p-4 relative shadow-lg">
            <div className="absolute top-3 right-3 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
              Default Recommended
            </div>
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              ZIP (LZMA Algorithm)
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 flex items-baseline gap-1.5 font-mono">
              <span>{lzmaSize} MB</span>
              <span className="text-xs text-emerald-400 font-semibold font-sans">
                (-{lzmaSavedPct}%)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Standard Python 3.3+ built-in (<code className="text-slate-200">zipfile.ZIP_LZMA</code>). Massive savings on text and repetitive code without external system tools.
            </div>
          </div>

          {/* TAR.XZ */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              TAR.XZ (Preset 9)
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 flex items-baseline gap-1.5 font-mono">
              <span>{xzSize} MB</span>
              <span className="text-xs text-emerald-400 font-semibold font-sans">
                (-{xzSavedPct}%)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Extreme compression used by Linux kernel and Debian packages. Ideal for archiving on Linux/macOS systems.
            </div>
          </div>

          {/* ZIP DEFLATE */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              ZIP (Deflate Level 9)
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100 flex items-baseline gap-1.5 font-mono">
              <span>{deflateSize} MB</span>
              <span className="text-xs text-emerald-400 font-semibold font-sans">
                (-{deflateSavedPct}%)
              </span>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 leading-relaxed">
              Max compression level using classic zlib Deflate. Compatible with double-click unzip on every OS.
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippet for Compression */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          Native Python High-Ratio Compression Implementation
        </h3>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`# 1. Native ZIP with LZMA (Included in Python 3.3+, No extra binaries needed)
import zipfile

with zipfile.ZipFile("example.com_archive.zip", "w", compression=zipfile.ZIP_LZMA) as zip_file:
    for root, _, files in os.walk("example.com"):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, start=".")
            zip_file.write(full_path, arcname=rel_path)

# 2. Native TAR.XZ with Maximum Preset (Extreme Ratio)
import tarfile

with tarfile.open("example.com_archive.tar.xz", "w:xz", preset=9) as tar:
    tar.add("example.com", arcname="example.com")
`}
        </pre>
      </div>
    </div>
  );
};
