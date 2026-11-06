export type CompressionFormat = 'zip-lzma' | 'zip-deflate' | 'tar-xz';

export interface ScraperConfig {
  startUrl: string;
  outputDir: string;
  delay: number;
  timeout: number;
  maxDepth: number | null;
  maxPages: number | null;
  compression: CompressionFormat;
  userAgentPreset: 'chrome' | 'firefox' | 'bot' | 'custom';
  customUserAgent: string;
  verifySsl: boolean;
  parseCss: boolean;
  parseSrcset: boolean;
  sanitizeQuery: boolean;
}

export type FileCategory = 'html' | 'javascript' | 'stylesheet' | 'json' | 'image' | 'font' | 'binary' | 'other';

export interface CrawledResource {
  url: string;
  localPath: string;
  category: FileCategory;
  extension: string;
  sizeBytes: number;
  depth: number;
  status: 200 | 404 | 500;
  isHtml: boolean;
  newLinksDiscovered: number;
  timestamp: string;
}

export interface CrawlLogMessage {
  id: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'archive';
  text: string;
  timestamp: string;
}
