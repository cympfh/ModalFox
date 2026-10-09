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
