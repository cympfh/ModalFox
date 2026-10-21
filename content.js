const HINT_CHARS = "asdfgqwertzxcvb";
const LINE = 60;
const TEXT_TYPES = new Set([
  "text", "search", "url", "email", "password", "tel", "number",
  "date", "time", "datetime-local", "month", "week",
]);

let mode = "browser";
let command = null;
let hint = null;
let pending = "";
let browserBuf = null;
let editing = false;
let errorTimer = 0;

const bar = document.createElement("div");
bar.id = "modalfox-bar";
bar.hidden = true;
const cands = document.createElement("div");
cands.id = "modalfox-cands";
cands.hidden = true;
const badge = document.createElement("div");
badge.id = "modalfox-mode";
badge.hidden = true;
document.documentElement.append(bar, cands, badge);

function commandNames() {
  return mode === "browser"
    ? ["vim", "set"]
    : ["browser", "open", "tabopen", "back", "forward", "set"];
}

function commandMatches(prefix) {
  return commandNames().filter((name) => name.startsWith(prefix));
}

function resolveCommand(line) {
  const { cmd, arg } = splitCommand(line);
  const found = commandMatches(cmd);
  if (found.length !== 1) return null;
  return { cmd: found[0], arg };
}

function showCands(prefix) {
  const found = commandMatches(prefix);
  if (!found.length || (found.length === 1 && found[0] === prefix)) {
    cands.hidden = true;
    return;
  }
  cands.hidden = false;
  cands.textContent = found.join("  ");
}

function hideCands() {
  cands.hidden = true;
}

function showModeBadge() {
  if (command !== null || browserBuf !== null) {
    badge.hidden = true;
    return;
  }
  badge.hidden = false;
  badge.textContent = editing ? "text" : mode;
}

function hideModeBadge() {
  badge.hidden = true;
}

function showBar(text, isError) {
  clearTimeout(errorTimer);
  bar.hidden = false;
  bar.textContent = text;
  bar.classList.toggle("modalfox-error", !!isError);
  hideModeBadge();
  if (isError) hideCands();
}

function hideBar() {
  clearTimeout(errorTimer);
  bar.hidden = true;
  bar.classList.remove("modalfox-error");
  hideCands();
  showModeBadge();
}

function fail(text) {
  command = null;
  browserBuf = null;
  showBar(text, true);
  errorTimer = setTimeout(hideBar, 1200);
}

function isEditable(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.closest("#modalfox-bar, #modalfox-cands, #modalfox-mode")) return false;
  if (el.isContentEditable) return true;
  if (el.getAttribute("role") === "textbox") return true;
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName === "INPUT") return TEXT_TYPES.has((el.type || "text").toLowerCase());
  return false;
}

function enterText() {
  if (mode !== "vim" || editing) return;
  editing = true;
  showModeBadge();
}

function leaveText() {
  if (!editing) return;
  editing = false;
  showModeBadge();
}

function applyMode(next) {
  mode = next;
  if (mode !== "vim") editing = false;
  command = null;
  pending = "";
  browserBuf = null;
  clearHint();
  hideBar();
  if (mode === "vim" && isEditable(document.activeElement)) enterText();
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
  const selector = "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=link], [role=button], [role=textbox], [contenteditable]:not([contenteditable=false]), [onclick]";
  const seen = new Set();
  const out = [];
  for (const el of document.querySelectorAll(selector)) {
    if (seen.has(el)) continue;
    if (el.closest("#modalfox-bar, #modalfox-cands, #modalfox-mode")) continue;
    if (!visible(el)) continue;
    seen.add(el);
    out.push({ el, text: isEditable(el) });
  }
  return out;
}

function clearHint() {
  hint = null;
  document.querySelectorAll(".modalfox-hint").forEach((el) => el.remove());
}

function placeHint(item) {
  const rect = item.el.getBoundingClientRect();
  const tag = document.createElement("div");
  tag.className = item.text ? "modalfox-hint modalfox-hint-text" : "modalfox-hint";
  tag.textContent = item.shown;
  tag.style.left = Math.max(0, rect.left) + "px";
  tag.style.top = Math.max(0, rect.top) + "px";
  document.documentElement.append(tag);
}

function startHint(newTab) {
  const targets = collectTargets();
  const labels = hintLabels(targets.length);
  const items = targets.slice(0, labels.length).map((target, i) => ({
    el: target.el,
    label: labels[i],
    shown: labels[i],
    text: target.text,
  }));
  hint = { items, typed: "", newTab };
  for (const item of items) placeHint(item);
}

async function activate(item, newTab) {
  clearHint();
  if (item.text) {
    item.el.focus();
    return;
  }
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
    item.shown = item.label.slice(hint.typed.length) || item.label;
    placeHint(item);
  }
}

async function runSet(arg) {
  const text = arg.replace(/\s+/g, "");
  if (text === "" || text === "scope") {
    const res = await browser.runtime.sendMessage({ type: "getScope" });
    showBar("scope=" + (res && res.scope ? res.scope : "tab"));
    errorTimer = setTimeout(hideBar, 1200);
    return;
  }
  const match = /^scope=(tab|global|domain)$/.exec(text);
  if (!match) {
    fail("bad set");
    return;
  }
  const res = await browser.runtime.sendMessage({ type: "setScope", scope: match[1] });
  if (!res || res.ok === false) {
    fail(res && res.error ? res.error : "set failed");
    return;
  }
  showBar("scope=" + match[1]);
  errorTimer = setTimeout(hideBar, 1200);
}

async function runResolved(resolved) {
  const { cmd, arg } = resolved;
  if (cmd === "set") return runSet(arg);
  if (cmd === "vim" && arg === "") {
    await setMode("vim");
    return;
  }
  if (cmd === "browser" && arg === "") {
    await setMode("browser");
    return;
  }
  if (cmd === "open") return openText(arg, false);
  if (cmd === "tabopen") return openText(arg, true);
  if (cmd === "back" || cmd === "forward") return goHistory(cmd, arg);
  fail("unknown");
}

async function runCommand() {
  const line = command;
  command = null;
  const resolved = resolveCommand(line);
  if (!resolved) {
    fail("ambiguous");
    return;
  }
  await runResolved(resolved);
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

function complete(line) {
  const { cmd, arg } = splitCommand(line);
  const found = commandMatches(cmd);
  if (found.length !== 1) return line;
  return arg ? found[0] + " " + arg : found[0];
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
  if (event.key === "Tab") {
    command = complete(command);
    showBar(":" + command);
    showCands(splitCommand(command).cmd);
    return;
  }
  if (event.key === "Enter") {
    runCommand();
    return;
  }
  if (event.key === "Backspace") {
    command = command.slice(0, -1);
    showBar(":" + command);
    showCands(splitCommand(command).cmd);
    return;
  }
  if (event.key.length === 1) {
    command += event.key;
    showBar(":" + command);
    showCands(splitCommand(command).cmd);
  }
}

function onBrowserKey(event) {
  if (browserBuf === null) {
    if (event.key === ":") {
      browserBuf = "";
      showBar(":");
      showCands("");
    }
    return;
  }
  if (event.key === "Escape") {
    browserBuf = null;
    hideBar();
    return;
  }
  if (event.key === "Tab") {
    browserBuf = complete(browserBuf);
    showBar(":" + browserBuf);
    showCands(splitCommand(browserBuf).cmd);
    return;
  }
  if (event.key === "Enter") {
    const resolved = resolveCommand(browserBuf);
    browserBuf = null;
    if (resolved && (resolved.cmd === "vim" || resolved.cmd === "set")) runResolved(resolved);
    else hideBar();
    return;
  }
  if (event.key === "Backspace") {
    browserBuf = browserBuf.slice(0, -1);
    showBar(":" + browserBuf);
    showCands(splitCommand(browserBuf).cmd);
    return;
  }
  if (event.key.length !== 1) return;
  browserBuf += event.key;
  showBar(":" + browserBuf);
  showCands(splitCommand(browserBuf).cmd);
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
    X: () => browser.runtime.sendMessage({ type: "restoreTab", vim: true }),
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
    showCands("");
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
  if (editing) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      const el = document.activeElement;
      if (el && typeof el.blur === "function") el.blur();
    }
    return;
  }
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

document.addEventListener("focusin", (event) => {
  if (isEditable(event.target)) enterText();
});

document.addEventListener("focusout", () => {
  setTimeout(() => {
    if (!isEditable(document.activeElement)) leaveText();
  }, 0);
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg.type === "applyMode") applyMode(msg.mode);
});

showModeBadge();
browser.runtime.sendMessage({ type: "getMode" }).then((res) => {
  if (res && res.mode) applyMode(res.mode);
});
