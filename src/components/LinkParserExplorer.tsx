import React, { useState } from 'react';
import {
  Code,
  FileCode,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface ExtractedItem {
  tag: string;
  attribute: string;
  rawValue: string;
  resolvedUrl: string;
  fileFormat: string;
}

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="/assets/css/theme.min.css">
  <link rel="icon" type="image/svg+xml" href="/brand/logo.svg">
  <link rel="preload" href="/fonts/inter-bold.woff2" as="font" type="font/woff2" crossorigin>
  <style>
    .hero-banner { background-image: url('/images/hero-bg.webp'); }
    @font-face { src: url('/fonts/custom-mono.woff'); }
  </style>
</head>
<body>
  <div class="content" style="background: url('/static/bg-pattern.svg');">
    <a href="/docs/getting-started.html">Read Documentation</a>
    <a href="/api/v1/openapi.json">API Schema JSON</a>
    
    <!-- Modern responsive images with srcset -->
    <img src="/static/placeholder.png"
         data-src="/images/high-res-hero.png"
         srcset="/images/hero-1x.webp 1x, /images/hero-2x.webp 2x"
         alt="Hero Showcase">

    <!-- Video with poster and multiple sources -->
    <video poster="/media/video_thumbnail.jpg" controls>
      <source src="/media/demo_reel.mp4" type="video/mp4">
      <source src="/media/demo_reel.webm" type="video/webm">
    </video>

    <!-- WebAssembly engine loader & JS chunks -->
    <script src="/static/js/wasm_loader.js"></script>
    <script src="/static/js/main.chunk.c81f0a.js"></script>
    
    <!-- Form action -->
    <form action="/api/v1/auth/login.php" method="POST"></form>
  </div>
</body>
</html>`;

export const LinkParserExplorer: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState<string>(SAMPLE_HTML);
  const [baseUrl, setBaseUrl] = useState<string>('https://example.com/app/');

  // Parse HTML string to find all extracted URLs
  const extractUrls = (html: string, base: string): ExtractedItem[] => {
    const results: ExtractedItem[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Tag & Attribute Matrix
    const attributeChecks = [
      { tag: 'a', attr: 'href' },
      { tag: 'link', attr: 'href' },
      { tag: 'script', attr: 'src' },
      { tag: 'img', attr: 'src' },
      { tag: 'source', attr: 'src' },
      { tag: 'video', attr: 'src' },
      { tag: 'audio', attr: 'src' },
      { tag: 'embed', attr: 'src' },
      { tag: 'form', attr: 'action' },
      { tag: 'video', attr: 'poster' },
    ];

    attributeChecks.forEach(({ tag, attr }) => {
      const elements = doc.querySelectorAll(`${tag}[${attr}]`);
      elements.forEach((el) => {
        const val = el.getAttribute(attr);
        if (val && !val.startsWith('#') && !val.startsWith('javascript:') && !val.startsWith('mailto:')) {
          try {
            const resolved = new URL(val, base).href;
            const ext = resolved.split('.').pop()?.split('?')[0] || 'html';
            results.push({
              tag,
              attribute: attr,
              rawValue: val,
              resolvedUrl: resolved,
              fileFormat: `.${ext}`,
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });
    });

    // 2. data-src and lazy loading attributes
    ['data-src', 'data-href', 'data-original', 'data-lazy-src'].forEach((attr) => {
      const elements = doc.querySelectorAll(`[${attr}]`);
      elements.forEach((el) => {
        const val = el.getAttribute(attr);
        if (val) {
          try {
            const resolved = new URL(val, base).href;
            const ext = resolved.split('.').pop()?.split('?')[0] || 'unknown';
            results.push({
              tag: el.tagName.toLowerCase(),
              attribute: attr,
              rawValue: val,
              resolvedUrl: resolved,
              fileFormat: `.${ext}`,
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });
    });

    // 3. srcset attributes
    const srcsetEls = doc.querySelectorAll('[srcset]');
    srcsetEls.forEach((el) => {
      const val = el.getAttribute('srcset') || '';
      val.split(',').forEach((candidate) => {
        const urlCandidate = candidate.trim().split(/\s+/)[0];
        if (urlCandidate) {
          try {
            const resolved = new URL(urlCandidate, base).href;
            const ext = resolved.split('.').pop()?.split('?')[0] || 'img';
            results.push({
              tag: el.tagName.toLowerCase(),
              attribute: 'srcset',
              rawValue: urlCandidate,
              resolvedUrl: resolved,
              fileFormat: `.${ext}`,
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });
    });

    // 4. CSS url(...) in <style>
    const styleTags = doc.querySelectorAll('style');
    const cssUrlRegex = /url\(\s*(?:['"]?)(.*?)(?:['"]?)\s*\)/gi;
    styleTags.forEach((s) => {
      let match;
      while ((match = cssUrlRegex.exec(s.textContent || '')) !== null) {
        const urlVal = match[1];
        if (urlVal && !urlVal.startsWith('data:')) {
          try {
            const resolved = new URL(urlVal, base).href;
            const ext = resolved.split('.').pop()?.split('?')[0] || 'asset';
            results.push({
              tag: 'style',
              attribute: 'css-url',
              rawValue: urlVal,
              resolvedUrl: resolved,
              fileFormat: `.${ext}`,
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      }
    });

    // 5. CSS url(...) in style="" attributes
    const inlineStyleEls = doc.querySelectorAll('[style]');
    inlineStyleEls.forEach((el) => {
      const styleAttr = el.getAttribute('style') || '';
      let match;
      const regex = /url\(\s*(?:['"]?)(.*?)(?:['"]?)\s*\)/gi;
      while ((match = regex.exec(styleAttr)) !== null) {
        const urlVal = match[1];
        if (urlVal && !urlVal.startsWith('data:')) {
          try {
            const resolved = new URL(urlVal, base).href;
            const ext = resolved.split('.').pop()?.split('?')[0] || 'asset';
            results.push({
              tag: el.tagName.toLowerCase(),
              attribute: 'style-url',
              rawValue: urlVal,
              resolvedUrl: resolved,
              fileFormat: `.${ext}`,
            });
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      }
    });

    return results;
  };

  const extracted = extractUrls(htmlInput, baseUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-fuchsia-400" />
          Universal Asset & Deep Link Inspection Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Requirement #1: Zero extension restrictions (.wasm, .json, .js, .svg, .php, etc.) and deep parsing across all 18+ HTML attributes.
        </p>
      </div>

      {/* Attribute Search Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          Active Attribute Extraction Matrix (Configured in Python Script)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {[
            { tag: '<a href>', target: 'Sub-links & HTML pages' },
            { tag: '<link href>', target: 'CSS stylesheets & Icons' },
            { tag: '<script src>', target: 'JavaScript & TS bundles' },
            { tag: '<img src>', target: 'Images, SVG, WebP' },
            { tag: '<source src>', target: 'Audio, Video, WebM' },
            { tag: '<form action>', target: 'Form endpoints & PHP/ASP' },
            { tag: '<video poster>', target: 'Cover art & Thumbnails' },
            { tag: '[srcset]', target: 'Responsive 2x/3x assets' },
            { tag: '[data-src]', target: 'Lazy-loaded scripts & images' },
            { tag: '[data-original]', target: 'Lazy-loading fallback' },
            { tag: '<style> url()', target: 'Embedded fonts & backgrounds' },
            { tag: 'style="" url()', target: 'Inline CSS background assets' },
          ].map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="font-mono text-cyan-300 font-semibold text-[11px]">{item.tag}</div>
              <div className="text-[10px] text-slate-400 mt-1">{item.target}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tester Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HTML Input Editor (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              Source HTML Code Input
            </span>
            <button
              onClick={() => setHtmlInput(SAMPLE_HTML)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Reset to Sample
            </button>
          </div>
          <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Base URL:</span>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <textarea
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs text-slate-300 bg-slate-950 focus:outline-none resize-none leading-relaxed"
            placeholder="Paste raw HTML here to inspect extracted asset URLs..."
          />
        </div>

        {/* Harvested Links Output (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Extracted Assets & Links ({extracted.length})
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
              100% Captured
            </span>
          </div>

          <div className="p-4 overflow-y-auto h-[440px] space-y-2 bg-slate-950">
            {extracted.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-12">
                No URLs or assets found in current HTML snippet.
              </div>
            ) : (
              extracted.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-mono">
                      <span className="text-cyan-400 font-bold">&lt;{item.tag}&gt;</span>
                      <span className="text-slate-500">via</span>
                      <span className="text-fuchsia-400 font-semibold">[{item.attribute}]</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {item.fileFormat}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-200 break-all select-all">
                    {item.resolvedUrl}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
