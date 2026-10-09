const modeEl = document.querySelector("#mode");
const toggle = document.querySelector("#toggle");
const disable = document.querySelector("#disable");

let mode = "browser";
let tabId = null;

function render() {
  modeEl.textContent = mode;
  toggle.textContent = mode === "vim" ? ":browser" : ":vim";
}

function fail(text) {
  modeEl.textContent = text;
}

toggle.addEventListener("click", async () => {
  if (tabId === null) return;
  mode = mode === "vim" ? "browser" : "vim";
  render();
  try {
    await browser.runtime.sendMessage({ type: "setMode", tabId, mode });
  } catch (err) {
    fail(String(err));
  }
});

disable.addEventListener("click", async () => {
  try {
    await browser.management.setEnabled(browser.runtime.id, false);
  } catch (err) {
    fail(String(err));
  }
});

async function init() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  tabId = tab.id;
  const res = await browser.runtime.sendMessage({ type: "getMode", tabId });
  if (res && res.mode) mode = res.mode;
  render();
}

init().catch((err) => fail(String(err)));
