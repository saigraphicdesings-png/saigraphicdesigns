import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../shop.js', import.meta.url), 'utf8');
const loader = source.slice(source.indexOf('    let catalogRequest = 0;'),
    source.indexOf('    setupFilters();', source.indexOf('    let catalogRequest = 0;')));

function shop(fetch) {
    const events = {};
    const context = vm.createContext({
        products: [], catalogStatus: 'loading', fetch,
        renderProducts() {}, console: { warn() {} },
        document: { visibilityState: 'visible', addEventListener(name, fn) { events[name] = fn; } },
        window: { addEventListener(name, fn) { events[name] = fn; } }
    });
    vm.runInContext(loader, context);
    return { context, events, refresh: () => context.loadManagedProducts(),
        ids: () => Array.from(context.products, p => p.id) };
}
const response = products => ({ ok: true, json: async () => ({ products }) });

test('deleting an original product and then the last product keeps them removed', async () => {
    let rows = [{ id: 'business-card-01' }, { id: 'custom-product' }];
    const page = shop(async (_url, options) => {
        assert.equal(options.cache, 'no-store');
        return response(rows);
    });
    await page.refresh();
    assert.deepEqual(page.ids(), ['business-card-01', 'custom-product']);
    rows = [{ id: 'custom-product' }];
    await page.refresh();
    assert.deepEqual(page.ids(), ['custom-product']);
    rows = [];
    await page.refresh();
    assert.deepEqual(page.ids(), []);
    assert.equal(page.context.catalogStatus, 'ready');
});

test('API and network failures never restore outdated products', async () => {
    for (const failure of [async () => ({ ok: false, status: 503 }),
        async () => { throw new Error('offline'); },
        async () => ({ ok: true, json: async () => ({}) })]) {
        const page = shop(failure);
        page.context.products = [{ id: 'business-card-01' }];
        await page.refresh();
        assert.deepEqual(page.ids(), []);
        assert.equal(page.context.catalogStatus, 'error');
    }
});

test('a stale request cannot restore a product after a newer refresh', async () => {
    let finish;
    const page = shop(() => new Promise(resolve => { finish = resolve; }));
    const older = page.refresh();
    const finishOlder = finish;
    const newer = page.refresh();
    finish(response([]));
    await newer;
    finishOlder(response([{ id: 'business-card-01' }]));
    await older;
    assert.deepEqual(page.ids(), []);
});

test('returning to the shop tab and restoring browser history refresh the catalog', async () => {
    let calls = 0;
    const page = shop(async () => { calls++; return response([]); });
    page.events.visibilitychange();
    page.events.pageshow({ persisted: true });
    page.events.pageshow({ persisted: false });
    assert.equal(calls, 2);
});
