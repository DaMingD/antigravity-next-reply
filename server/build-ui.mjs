import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'ui', 'dist');
fs.mkdirSync(distDir, { recursive: true });

const built = await esbuild.build({
  entryPoints: [path.join(__dirname, 'ui', 'app.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  write: false,
});

const js = built.outputFiles[0].text;

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: transparent;
    color: var(--color-text-primary, #1f1f1f);
    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
    font-size: 13px;
    line-height: 1.4;
  }
  .nr-wrap {
    padding: 6px 2px 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .nr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 2px;
  }
  .nr-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary, #5f6368);
  }
  .nr-sub {
    font-size: 11px;
    color: var(--color-text-tertiary, #80868b);
  }
  .nr-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }
  .nr-chip-group {
    display: inline-flex;
    align-items: stretch;
    border-radius: 10px;
    border: 1px solid var(--color-border-primary, rgba(128, 128, 128, 0.28));
    background: var(--color-background-secondary, rgba(128, 128, 128, 0.08));
    overflow: hidden;
    transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease, opacity 120ms ease;
    max-width: 100%;
  }
  .nr-chip-group:hover:not(.is-dim):not(.is-sent) {
    border-color: var(--color-ring-primary, #4285f4);
    background: var(--color-background-tertiary, rgba(66, 133, 244, 0.08));
    transform: translateY(-1px);
  }
  .nr-chip-group.is-sent {
    border-color: var(--color-border-success, #34a853);
    background: var(--color-background-success, rgba(52, 168, 83, 0.12));
  }
  .nr-chip-group.is-dim {
    opacity: 0.45;
  }
  .nr-chip {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--color-text-primary, #1f1f1f);
    font: inherit;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }
  .nr-chip:disabled {
    cursor: default;
  }
  .nr-badge {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    background: var(--color-background-primary, rgba(255, 255, 255, 0.7));
    color: var(--color-text-secondary, #5f6368);
    border: 1px solid var(--color-border-secondary, rgba(128, 128, 128, 0.22));
  }
  .nr-chip-group.is-sent .nr-badge {
    background: var(--color-border-success, #34a853);
    color: #fff;
    border-color: transparent;
  }
  .nr-label {
    word-break: break-word;
  }
  .nr-arrow {
    flex-shrink: 0;
    font-size: 11px;
    color: var(--color-text-tertiary, #80868b);
    margin-left: 2px;
  }
  .nr-edit-btn {
    appearance: none;
    border: none;
    border-left: 1px solid var(--color-border-secondary, rgba(128, 128, 128, 0.2));
    background: transparent;
    color: var(--color-text-tertiary, #80868b);
    font-size: 12px;
    padding: 0 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 120ms ease, color 120ms ease;
  }
  .nr-edit-btn:hover {
    background: var(--color-background-primary, rgba(128, 128, 128, 0.14));
    color: var(--color-text-primary, #1f1f1f);
  }
  .nr-edit-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 2px;
  }
  .nr-edit-input {
    flex: 1;
    min-width: 0;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--color-ring-primary, #4285f4);
    background: var(--color-background-primary, #fff);
    color: var(--color-text-primary, #1f1f1f);
    font: inherit;
    outline: none;
  }
  .nr-edit-send, .nr-edit-cancel {
    appearance: none;
    border-radius: 8px;
    font: inherit;
    font-size: 12px;
    padding: 6px 10px;
    cursor: pointer;
    white-space: nowrap;
  }
  .nr-edit-send {
    border: 1px solid transparent;
    background: var(--color-ring-primary, #4285f4);
    color: #fff;
    font-weight: 500;
  }
  .nr-edit-cancel {
    border: 1px solid var(--color-border-primary, rgba(128, 128, 128, 0.3));
    background: transparent;
    color: var(--color-text-secondary, #5f6368);
  }
  .nr-empty {
    font-size: 12px;
    color: var(--color-text-tertiary, #80868b);
    padding: 4px 2px;
  }
  .nr-error {
    font-size: 12px;
    color: var(--color-text-danger, #d93025);
    padding: 2px;
  }
</style>
</head>
<body>
  <div id="app"></div>
  <script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(path.join(distDir, 'chips.html'), html, 'utf8');
console.log(`Built ui/dist/chips.html (${html.length} bytes)`);
