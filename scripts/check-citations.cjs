// Run against a local frontend: BASE_URL=http://localhost:3108 node scripts/check-citations.cjs
// Playwright is supplied by the development environment; every API response is mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://localhost:3108';
const output = process.env.CHECK_OUTPUT_DIR || '.next/citation-check';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const chapters = [id(1), id(2)];
const docs = [id(3), id(4)];
const now = '2026-10-10T10:00:00Z';
const question = 'Explain the electromagnetic field';
const advisory = "I couldn't find this in the current chapter, but here is what I found in your other notes...";
const source = { document_id: docs[1], chapter_id: chapters[1], title: 'Physics notes',
  snippet: 'Evidence from the second page', page_number: 2, version: 3, is_fallback_scope: true };
const msg = (n, sender, text, extra = {}) => ({ id: id(n), session: id(8), sender, text,
  tokens: null, error: null, created_at: now, citations: [], suggestions: [], ...extra });
const subjects = [{ id: id(9), name: 'Study material', description: null, created_at: now,
  updated_at: now, chapters: chapters.map((chapter, i) => ({ id: chapter, subject: id(9),
    name: i ? 'Electromagnetism' : 'Organic Chemistry', order: i + 1, created_at: now,
    updated_at: now, documents: [{ id: docs[i], title: i ? 'Physics notes' : 'Chemistry notes',
      status: 'COMPLETED', error_message: null, created_at: now }] })) }];

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  try {
    for (const [name, viewport] of [['desktop', { width: 1440, height: 960 }],
      ['mobile', { width: 390, height: 844 }]]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const sent = [];
      const pageRequests = [];
      let answered = false;
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        const p = url.pathname;
        const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204,
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*',
            'access-control-allow-methods': '*' } });
        if (p === '/api/auth/refresh') return json({ access: 'offline-test-token' });
        if (p.endsWith('/auth/subjects/')) return json(subjects);
        if (p.endsWith('/auth/ws-ticket/')) return json({ error: 'No socket in offline check' }, 503);
        if (p.endsWith('/messages/')) {
          const history = answered
            ? [msg(11, 'ai', advisory + '\n\nField explanation.', { citations: [source] }), msg(10, 'user', question)]
            : [msg(11, 'ai', "I couldn't find this in the current chapter.", { is_unanswered: true }), msg(10, 'user', question)];
          return json({ count: 2, next: null, previous: null, results: history });
        }
        if (p.endsWith('/auth/rag-chat/')) {
          const body = route.request().postDataJSON();
          sent.push(body);
          answered = true;
          return json({ id: id(20 + sent.length), sender: 'ai', text: advisory + '\n\nField explanation.',
            sources: [source], followups: [], is_unanswered: false }, 201);
        }
        if (p.endsWith('/notes/')) return json([]);
        if (p.endsWith('/content/')) return json({ id: p.includes(docs[1]) ? docs[1] : docs[0], title: 'Notes', text: 'Canonical text' });
        if (p.endsWith('/pages/')) {
          pageRequests.push(url);
          if (url.searchParams.get('version') === '1') return json({ error: 'Source changed' }, 409);
          return json([1, 2].map((number) => ({ page_number: number, text_source: 'layer',
            reconstructed_md: `# Page ${number}\n\n` + 'Evidence on this page. '.repeat(180),
            image_url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="160"><rect width="500" height="160" fill="#f1ede1"/><text x="30" y="80" font-size="24">Original scan, page ${number}</text></svg>`) })));
        }
        if (url.origin !== new URL(base).origin) return route.abort();
        return route.continue();
      });
      await page.goto(`${base}/dashboard/chapter/${chapters[0]}`);
      if (name === 'mobile') await page.getByRole('button', { name: 'Discuss', exact: true }).click();
      const retry = page.getByRole('button', { name: 'Search my other notes' });
      await retry.waitFor();
      await page.screenshot({ path: path.join(output, `${name}-retry.png`) });
      await retry.click();
      const citationLink = page.getByRole('link', { name: 'Physics notes · Page 2 · Other notes' }).last();
      await citationLink.waitFor();
      assert.deepEqual(sent[0], { chapter: chapters[0], text: question, allow_library_fallback: true });
      const input = page.getByPlaceholder('Ask about this source…');
      await input.fill('Explain another concept');
      await input.press('Enter');
      await page.waitForFunction(() => !document.querySelector('input')?.disabled);
      assert.equal(sent[1].allow_library_fallback, false, 'Opt-in must not leak to the next message');
      await page.screenshot({ path: path.join(output, `${name}-sources.png`) });
      await citationLink.click();
      await page.getByRole('img', { name: 'Original scan of page 2' }).waitFor();
      assert.equal(new URL(page.url()).pathname, `/dashboard/chapter/${chapters[1]}`);
      assert(pageRequests.some((u) => u.pathname.includes(docs[1]) && u.searchParams.get('version') === '3'));
      assert.equal(await page.locator('[data-page="2"]').evaluate((el) => document.activeElement === el), true);
      await page.waitForFunction(() => {
        const page = document.querySelector('[data-page="2"]');
        const top = page?.getBoundingClientRect().top;
        return top !== undefined && top >= 0 && top < 180;
      });
      await page.screenshot({ path: path.join(output, `${name}-page.png`) });
      // Reload proves stored citations retain the page/version fields.
      await page.reload();
      await page.getByRole('img', { name: 'Original scan of page 2' }).waitFor();
      if (name === 'mobile') await page.getByRole('button', { name: 'Discuss', exact: true }).click();
      await page.getByRole('link', { name: 'Physics notes · Page 2 · Other notes' }).waitFor();
      await page.goto(`${base}/dashboard/chapter/${chapters[1]}?document=${docs[1]}&page=2&version=1`);
      await page.getByRole('alert').filter({ hasText: 'changed since the answer' }).waitFor();
      assert.equal(await page.locator('[data-page]').count(), 0, 'Stale citation must not display replacement pages');
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${name}: opt-in, normal request reset, source navigation, saved citations, and stale version checks passed`);
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
