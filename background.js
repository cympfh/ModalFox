async function restoreTab(vim) {
  const closed = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
  if (!closed.length) return { ok: false, error: "empty" };
  const session = await browser.sessions.restore(closed[0].sessionId);
  const tab = session && (session.tab || (session.window && session.window.tabs && session.window.tabs[0]));
  if (vim && tab) modeByTab.set(tab.id, "vim");
  return { ok: true };
}
