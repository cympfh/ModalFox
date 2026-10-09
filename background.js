async function neighbor(tabId, dir) {
  const tabs = await browser.tabs.query({ currentWindow: true });
  tabs.sort((a, b) => a.index - b.index);
  const index = tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0 || tabs.length < 2) return;
  const next = tabs[(index + dir + tabs.length) % tabs.length];
  await browser.tabs.update(next.id, { active: true });
}
