// Offline API fixtures; run against a production frontend build on BASE_URL.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://localhost:3108';
const output = process.env.CHECK_OUTPUT_DIR || '.next/coverage-check';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const now = '2026-10-10T10:00:00Z';
const audit = (version, page) => ({ code: 'INCOMPLETE_COVERAGE', version,
  pages: [{ page_number: page, review_reason: 'Too little readable text' }] });
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    for (const [name, viewport] of [['desktop', { width: 1440, height: 960 }], ['mobile', { width: 390, height: 844 }]]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      let failedRebuild = false;
      let failedNewUpload = false;
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        const p = url.pathname;
        const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204,
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
        if (p === '/api/auth/refresh') return json({ access: 'offline-test-token' });
        if (p.endsWith('/auth/ws-ticket/')) return json({}, 503);
        const doc = { id: id(3), chapter: id(1), title: 'Scanned coaching notes', status: 'COMPLETED',
          error_message: null, created_at: now, active_version: 1, active_coverage: audit(1, 2),
          coverage_audit: failedRebuild ? audit(2, 3) : audit(1, 2) };
        if (p.endsWith('/auth/subjects/') && failedNewUpload) return json([]);
        if (p.endsWith('/auth/subjects/')) return json([{ id: id(9), name: 'Physics', description: null,
          created_at: now, updated_at: now, chapters: [{ id: id(1), subject: id(9), name: 'Mechanics',
            order: 1, created_at: now, updated_at: now, documents: [doc] }] }]);
        if (p.endsWith('/auth/documents/')) return json([failedNewUpload ? { ...doc, chapter: null,
          status: 'FAILED', active_version: 0, active_coverage: {}, error_message: 'No readable text' } : doc]);
        if (p.endsWith('/messages/')) return json({ count: 0, next: null, previous: null, results: [] });
        if (p.endsWith('/notes/')) return json([]);
        if (p.endsWith('/content/')) return json({ id: id(3), title: doc.title, text: 'Readable coaching notes.' });
        if (p.endsWith('/pages/')) return json([1, 2].map(number => ({ page_number: number,
          text_source: number === 1 ? 'ocr' : 'fallback', needs_review: number === 2,
          review_reason: number === 2 ? 'Too little readable text' : '',
          reconstructed_md: number === 1 ? '# Readable coaching notes\n\nNewton’s second law relates force, mass and acceleration.' : '',
          image_url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="160"><rect width="500" height="160" fill="#f1ede1"/><text x="30" y="80" font-size="24">Original scan, page ${number}</text></svg>`) })));
        if (url.origin !== new URL(base).origin) return route.abort();
        return route.continue();
      });
      await page.goto(`${base}/dashboard/chapter/${id(1)}`);
      await page.getByText('We couldn’t read pages 2.', { exact: false }).waitFor();
      await page.getByText('We couldn’t read enough of this page.', { exact: false }).waitFor();
      await page.getByRole('img', { name: 'Original scan of page 2' }).waitFor();
      assert.equal(await page.getByText('Readable coaching notes', { exact: true }).count(), 1);
      await page.screenshot({ path: path.join(output, `${name}-coverage.png`) });
      await page.reload();
      await page.getByText('We couldn’t read pages 2.', { exact: false }).waitFor();
      failedRebuild = true;
      await page.reload();
      await page.getByText('The previous version remains available.').waitFor();
      await page.getByText('We couldn’t read pages 3.', { exact: false }).waitFor();
      await page.getByText('Readable coaching notes', { exact: true }).waitFor();
      await page.screenshot({ path: path.join(output, `${name}-failed-rebuild.png`) });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      failedNewUpload = true;
      await page.evaluate(() => localStorage.clear());
      await page.goto(`${base}/dashboard`);
      await page.getByText('Ingestion failed', { exact: true }).waitFor();
      await page.getByText('We couldn’t read pages 3.', { exact: false }).waitFor();
      await page.reload();
      await page.getByText('Ingestion failed', { exact: true }).waitFor();
      await page.getByText('We couldn’t read pages 3.', { exact: false }).waitFor();
      await page.screenshot({ path: path.join(output, `${name}-failed-upload.png`) });
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${name}: OCR text, page warnings, original scan, refresh persistence and failed rebuild checks passed`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
