const HINT_CHARS = "asdfgqwertzxcvb";
const LINE = 60;

let mode = "browser";
let command = null;
let hint = null;
let pending = "";
let browserBuf = null;
let errorTimer = 0;
let modeTimer = 0;

const bar = document.createElement("div");
bar.id = "modalfox-bar";
bar.hidden = true;
const badge = document.createElement("div");
badge.id = "modalfox-mode";
badge.hidden = true;
document.documentElement.append(bar, badge);

function showBar(text, isError) {
  clearTimeout(errorTimer);
  bar.hidden = false;
  bar.textContent = text;
  bar.classList.toggle("modalfox-error", !!isError);
}

function showStatus() {
  clearTimeout(errorTimer);
  bar.hidden = false;
  bar.classList.remove("modalfox-error");
  bar.textContent = "vim";
}

function hideBar() {
  clearTimeout(errorTimer);
  bar.classList.remove("modalfox-error");
  if (mode === "vim" && command === null) {
    showStatus();
    return;
  }
  bar.hidden = true;
}

function flashMode(name) {
  clearTimeout(modeTimer);
  badge.hidden = false;
  badge.textContent = name;
  modeTimer = setTimeout(() => {
    badge.hidden = true;
  }, 2000);
}

function fail(text) {
  command = null;
  showBar(text, true);
  errorTimer = setTimeout(hideBar, 1200);
}

function applyMode(next) {
  const changed = mode !== next;
  mode = next;
  command = null;
  pending = "";
  browserBuf = null;
  clearHint();
  hideBar();
  if (changed) flashMode(next);
}

async function setMode(next) {
  applyMode(next);
  await browser.runtime.sendMessage({ type: "setMode", mode: next });
}

function countArg(arg) {
  if (arg === "") return 1;
  if (!/^[1-9]\d*$/.test(arg)) return null;
  return Number(arg);
}

function splitCommand(line) {
  const trimmed = line.trim();
  const index = trimmed.indexOf(" ");
  if (index === -1) return { cmd: trimmed, arg: "" };
  return { cmd: trimmed.slice(0, index), arg: trimmed.slice(index + 1).trim() };
}

function visible(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return false;
  if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return false;
  const style = getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

function hintLabels(count) {
  const chars = [...HINT_CHARS];
  if (count <= chars.length) return chars.slice(0, count);
  const labels = [];
  for (const a of chars) {
    for (const b of chars) {
      labels.push(a + b);
      if (labels.length === count) return labels;
    }
  }
  return labels;
}

function collectTargets() {
  const selector = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=link], [role=button], [onclick]";
  return [...document.querySelectorAll(selector)].filter((el) => !el.closest("#modalfox-bar, #modalfox-mode") && visible(el));
}

function clearHint() {
  hint = null;
  document.querySelectorAll(".modalfox-hint").forEach((el) => el.remove());
}

function startHint(newTab) {
  const targets = collectTargets();
  const labels = hintLabels(targets.length);
  const items = targets.slice(0, labels.length).map((el, i) => ({ el, label: labels[i] }));
  hint = { items, typed: "", newTab };
  for (const item of items) {
    const rect = item.el.getBoundingClientRect();
    const tag = document.createElement("div");
    tag.className = "modalfox-hint";
    tag.textContent = item.label;
    tag.style.left = Math.max(0, rect.left) + "px";
    tag.style.top = Math.max(0, rect.top) + "px";
    document.documentElement.append(tag);
  }
}

async function activate(item, newTab) {
  clearHint();
  const href = item.el.closest("a[href]")?.href || item.el.href;
  if (newTab && href) {
    await browser.runtime.sendMessage({ type: "open", text: href, newTab: true, vim: true });
    return;
  }
  item.el.focus();
  item.el.click();
}

function onHintKey(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    clearHint();
    setMode("browser");
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    event.stopPropagation();
    hint.typed = hint.typed.slice(0, -1);
    refreshHint();
    return;
  }
  if (!HINT_CHARS.includes(event.key)) {
    event.preventDefault();
    event.stopPropagation();
    clearHint();
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  hint.typed += event.key;
  const matches = hint.items.filter((item) => item.label.startsWith(hint.typed));
  if (matches.length === 1 && matches[0].label === hint.typed) {
    activate(matches[0], hint.newTab);
    return;
  }
  if (matches.length === 0) {
    clearHint();
    return;
  }
  refreshHint();
}

function refreshHint() {
  document.querySelectorAll(".modalfox-hint").forEach((el) => el.remove());
  for (const item of hint.items) {
    if (!item.label.startsWith(hint.typed)) continue;
    const rect = item.el.getBoundingClientRect();
    const tag = document.createElement("div");
    tag.className = "modalfox-hint";
    tag.textContent = item.label.slice(hint.typed.length) || item.label;
    tag.style.left = Math.max(0, rect.left) + "px";
    tag.style.top = Math.max(0, rect.top) + "px";
    document.documentElement.append(tag);
  }
}

async function runCommand() {
  const line = command;
  command = null;
  const { cmd, arg } = splitCommand(line);
  if (cmd === "browser" && arg === "") {
    await setMode("browser");
    return;
  }
  if (cmd === "open") return openText(arg, false);
  if (cmd === "tabopen") return openText(arg, true);
  if (cmd === "back" || cmd === "forward") return goHistory(cmd, arg);
  fail("unknown");
}

async function openText(text, newTab) {
  hideBar();
  const res = await browser.runtime.sendMessage({
    type: "open",
    text,
    newTab,
    vim: newTab && mode === "vim",
  });
  if (!res || res.ok === false) fail(res && res.error ? res.error : "open failed");
}

function goHistory(cmd, arg) {
  const count = countArg(arg);
  if (count === null) {
    fail("bad count");
    return;
  }
  hideBar();
  history.go(cmd === "back" ? -count : count);
}

function onCommandKey(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    command = null;
    hideBar();
    if (mode === "vim") setMode("browser");
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Enter") {
    runCommand();
    return;
  }
  if (event.key === "Backspace") {
    command = command.slice(0, -1);
    showBar(":" + command);
    return;
  }
  if (event.key.length === 1) {
    command += event.key;
    showBar(":" + command);
  }
}

function onBrowserKey(event) {
  if (event.key === ":") {
    browserBuf = "";
    return;
  }
  if (browserBuf === null) return;
  if (event.key === "Escape") {
    if (browserBuf === "vim") setMode("vim");
    browserBuf = null;
    return;
  }
  if (event.key === "Backspace") {
    browserBuf = browserBuf.slice(0, -1);
    return;
  }
  if (event.key.length !== 1) {
    browserBuf = null;
    return;
  }
  browserBuf += event.key;
  if (!"vim".startsWith(browserBuf)) browserBuf = null;
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(location.href);
  } catch {
    fail("copy failed");
  }
}

async function paste(newTab) {
  let text = "";
  try {
    text = (await navigator.clipboard.readText()).trim();
  } catch {
    fail("paste failed");
    return;
  }
  if (!text) return;
  await openText(text, newTab);
}

function onVimKey(event) {
  const key = event.key;
  if (pending === "g") {
    pending = "";
    if (key === "g") {
      event.preventDefault();
      event.stopPropagation();
      scrollTo(0, 0);
      return;
    }
  }
  if (pending === "y") {
    pending = "";
    if (key === "y") {
      event.preventDefault();
      event.stopPropagation();
      copyUrl();
      return;
    }
  }
  const handled = {
    h: () => scrollBy(-LINE, 0),
    j: () => scrollBy(0, LINE),
    k: () => scrollBy(0, -LINE),
    l: () => scrollBy(LINE, 0),
    d: () => scrollBy(0, innerHeight / 2),
    u: () => scrollBy(0, -innerHeight / 2),
    G: () => scrollTo(0, document.documentElement.scrollHeight),
    H: () => history.back(),
    L: () => history.forward(),
    J: () => browser.runtime.sendMessage({ type: "nextTab" }),
    K: () => browser.runtime.sendMessage({ type: "prevTab" }),
    x: () => browser.runtime.sendMessage({ type: "closeTab" }),
    X: () => browser.runtime.sendMessage({ type: "restoreTab" }),
    t: () => browser.runtime.sendMessage({ type: "newTab", vim: true }),
    f: () => startHint(false),
    F: () => startHint(true),
    p: () => paste(false),
    P: () => paste(true),
  };
  if (key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setMode("browser");
    return;
  }
  if (key === ":") {
    event.preventDefault();
    event.stopPropagation();
    command = "";
    showBar(":");
    return;
  }
  if (key === "g" || key === "y") {
    event.preventDefault();
    event.stopPropagation();
    pending = key;
    return;
  }
  if (!handled[key]) return;
  event.preventDefault();
  event.stopPropagation();
  handled[key]();
}

window.addEventListener("keydown", (event) => {
  if (event.isComposing || event.key === "Process") return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (mode === "browser") {
    onBrowserKey(event);
    return;
  }
  if (command !== null) {
    onCommandKey(event);
    return;
  }
  if (hint) {
    onHintKey(event);
    return;
  }
  onVimKey(event);
}, true);

browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === "applyMode") applyMode(msg.mode);
});

browser.runtime.sendMessage({ type: "getMode" }).then((res) => {
  if (res && res.mode === "vim") applyMode("vim");
});
