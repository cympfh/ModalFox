const modeByTab = new Map();

function modeOf(tabId) {
  return modeByTab.get(tabId) || "browser";
}

function tabIdOf(msg, sender) {
  return (sender.tab && sender.tab.id) || msg.tabId;
}

async function applyMode(tabId, next) {
  modeByTab.set(tabId, next);
  try {
    await browser.tabs.sendMessage(tabId, { type: "applyMode", mode: next });
  } catch {
    // about: pages have no content script. The stored mode applies on the next page.
  }
  return { ok: true, mode: next };
}

function isUrl(text) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return true;
  return /^[^\s/]+\.[^\s/]+/.test(text);
}

function toUrl(text) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text;
  return "https://" + text;
}

async function openTarget(text, tabId, newTab, vim) {
  const raw = text.trim();
  if (!raw) return { ok: false, error: "empty" };
  if (isUrl(raw)) {
    const url = toUrl(raw);
    if (newTab) {
      const tab = await browser.tabs.create({ url, active: true });
      if (vim) modeByTab.set(tab.id, "vim");
      return { ok: true };
    }
    await browser.tabs.update(tabId, { url });
    return { ok: true };
  }
  if (newTab) {
    const tab = await browser.tabs.create({ active: true });
    if (vim) modeByTab.set(tab.id, "vim");
    await browser.search.search({ query: raw, tabId: tab.id });
    return { ok: true };
  }
  await browser.search.search({ query: raw, tabId });
  return { ok: true };
}

async function neighbor(tabId, dir) {
  const tabs = await browser.tabs.query({ currentWindow: true });
  tabs.sort((a, b) => a.index - b.index);
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0 || tabs.length < 2) return;
  const next = tabs[(index + dir + tabs.length) % tabs.length];
  await browser.tabs.update(next.id, { active: true });
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = tabIdOf(msg, sender);
  (async () => {
    if (msg.type === "getMode") return { mode: modeOf(tabId) };
    if (msg.type === "setMode") {
      if (sender.tab) {
        modeByTab.set(tabId, msg.mode);
        return { ok: true, mode: msg.mode };
      }
      return applyMode(tabId, msg.mode);
    }
    if (msg.type === "closeTab") {
      await browser.tabs.remove(tabId);
      return { ok: true };
    }
    if (msg.type === "restoreTab") {
      const closed = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
      if (!closed.length) return { ok: false, error: "empty" };
      await browser.sessions.restore(closed[0].sessionId);
      return { ok: true };
    }
    if (msg.type === "nextTab") {
      await neighbor(tabId, 1);
      return { ok: true };
    }
    if (msg.type === "prevTab") {
      await neighbor(tabId, -1);
      return { ok: true };
    }
    if (msg.type === "newTab") {
      const tab = await browser.tabs.create({ active: true });
      if (msg.vim) modeByTab.set(tab.id, "vim");
      return { ok: true };
    }
    if (msg.type === "open") return openTarget(msg.text, tabId, msg.newTab, msg.vim);
    return { ok: false, error: "unknown" };
  })().then(sendResponse, (err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});

browser.tabs.onRemoved.addListener((tabId) => {
  modeByTab.delete(tabId);
});
