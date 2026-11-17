import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 25+ defines its own localStorage/sessionStorage globals (unusable without
// --localstorage-file) that shadow jsdom's. Point them back at the jsdom window's storage.
const dom = globalThis.jsdom;
if (dom) {
    for (const name of ['localStorage', 'sessionStorage']) {
        Object.defineProperty(globalThis, name, { configurable: true, get: () => dom.window[name] });
    }
}

afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
});
