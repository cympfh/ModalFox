function commandNames() {
  return mode === "browser"
    ? ["vim", "set"]
    : ["browser", "open", "tabopen", "back", "forward", "set"];
}
