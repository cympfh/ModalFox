function onBrowserKey(event) {
  if (browserBuf === null) {
    if (event.key === ":") {
      browserBuf = "";
      showBar(":");
    }
    return;
  }
  if (event.key === "Enter" || event.key === "Escape") {
    if (browserBuf === "vim") setMode("vim");
    else {
      browserBuf = null;
      hideBar();
    }
    return;
  }
  if (event.key === "Backspace") {
    browserBuf = browserBuf.slice(0, -1);
    showBar(":" + browserBuf);
    return;
  }
  if (event.key.length !== 1) return;
  browserBuf += event.key;
  showBar(":" + browserBuf);
}
