const modeByTab = new Map();
const domainModes = {};
let scope = "tab";
let globalMode = "browser";

const ready = browser.storage.local.get(["scope", "globalMode", "domainModes"]).then((data) => {
  if (data.scope === "tab" || data.scope === "global" || data.scope === "domain") scope = data.scope;
  if (data.globalMode === "browser" || data.globalMode === "vim") globalMode = data.globalMode;
  if (data.domainModes && typeof data.domainModes === "object") Object.assign(domainModes, data.domainModes);
});

function tabIdOf(msg, sender) {
  return (sender.tab && sender.tab.id) || msg.tabId;
}

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function modeFor(tab) {
  if (scope === "global") return globalMode;
  if (scope === "domain") {
    const host = hostOf(tab.url || "");
    if (!host) return modeByTab.get(tab.id) || "browser";
    return domainModes[host] || "browser";
  }
  return modeByTab.get(tab.id) || "browser";
}

async function persist() {
  await browser.storage.local.set({ scope, globalMode, domainModes });
}

async function pushMode(tabId, mode) {
  try {
    await browser.tabs.sendMessage(tabId, { type: "applyMode", mode });
  } catch {
    // about: pages have no content script.
  }
}

async function remember(tab, mode) {
  if (scope === "global") {
    globalMode = mode;
    await persist();
    const tabs = await browser.tabs.query({});
    await Promise.all(tabs.map((item) => pushMode(item.id, mode)));
    return;
  }
  if (scope === "domain") {
    const host = hostOf(tab.url || "");
    if (host) {
      domainModes[host] = mode;
      await persist();
      const tabs = await browser.tabs.query({});
      await Promise.all(tabs.filter((item) => hostOf(item.url || "") === host).map((item) => pushMode(item.id, mode)));
      return;
    }
  }
  modeByTab.set(tab.id, mode);
  await pushMode(tab.id, mode);
}

async function setScope(tab, next) {
  const current = modeFor(tab);
  scope = next;
  if (next === "global") globalMode = current;
  if (next === "domain") {
    const host = hostOf(tab.url || "");
    if (host) domainModes[host] = current;
  }
  if (next === "tab") modeByTab.set(tab.id, current);
  await persist();
  if (next === "global") {
    const tabs = await browser.tabs.query({});
    await Promise.all(tabs.map((item) => pushMode(item.id, current)));
  }
  if (next === "domain") {
    const host = hostOf(tab.url || "");
    if (host) {
      const tabs = await browser.tabs.query({});
      await Promise.all(tabs.filter((item) => hostOf(item.url || "") === host).map((item) => pushMode(item.id, current)));
    }
  }
  return { ok: true, scope };
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
      if (vim && scope === "tab") modeByTab.set(tab.id, "vim");
      if (vim && scope === "domain" && !hostOf(url)) modeByTab.set(tab.id, "vim");
      return { ok: true };
    }
    await browser.tabs.update(tabId, { url });
    return { ok: true };
  }
  if (newTab) {
    const tab = await browser.tabs.create({ active: true });
    if (vim && scope !== "global") modeByTab.set(tab.id, "vim");
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

async function restoreTab(vim) {
  const closed = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
  if (!closed.length) return { ok: false, error: "empty" };
  const session = await browser.sessions.restore(closed[0].sessionId);
  const tab = session && (session.tab || (session.window && session.window.tabs && session.window.tabs[0]));
  if (vim && tab && scope === "tab") modeByTab.set(tab.id, "vim");
  if (vim && tab && scope === "domain" && !hostOf(tab.url || "")) modeByTab.set(tab.id, "vim");
  return { ok: true };
}

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = tabIdOf(msg, sender);
  (async () => {
    await ready;
    if (msg.type === "getScope") return { scope };
    if (msg.type === "setScope") {
      const tab = await browser.tabs.get(tabId);
      return setScope(tab, msg.scope);
    }
    if (msg.type === "getMode") {
      const tab = await browser.tabs.get(tabId);
      return { mode: modeFor(tab), scope };
    }
    if (msg.type === "setMode") {
      const tab = await browser.tabs.get(tabId);
      await remember(tab, msg.mode);
      return { ok: true, mode: msg.mode };
    }
    if (msg.type === "closeTab") {
      await browser.tabs.remove(tabId);
      return { ok: true };
    }
    if (msg.type === "restoreTab") return restoreTab(msg.vim);
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
      if (msg.vim && scope !== "global") modeByTab.set(tab.id, "vim");
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

browser.tabs.onUpdated.addListener((tabId, change, tab) => {
  if (!change.url || scope !== "domain") return;
  pushMode(tabId, modeFor(tab));
});
