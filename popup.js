const modeEl = document.querySelector("#mode");
const toggle = document.querySelector("#toggle");
const disable = document.querySelector("#disable");

const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
let mode = "browser";

function render() {
  modeEl.textContent = mode;
  toggle.textContent = mode === "vim" ? "browser にする" : "vim にする";
}

const res = await browser.runtime.sendMessage({ type: "getMode", tabId: tab.id });
if (res && res.mode) mode = res.mode;
render();

toggle.addEventListener("click", async () => {
  mode = mode === "vim" ? "browser" : "vim";
  await browser.runtime.sendMessage({ type: "setMode", tabId: tab.id, mode });
  render();
});

disable.addEventListener("click", async () => {
  await browser.management.setEnabled(browser.runtime.id, false);
});
