# ModalFox

Vim-style modal keybindings for Firefox.

Initial mode is `browser`. Keys are not captured. `:` opens the command line and is also delivered to the page. `:vim` enters `vim`.

See [SPEC.md](SPEC.md).

## Load

`about:debugging` → This Firefox → Load Temporary Add-on → `manifest.json`.

## Release

Push a tag `v0.1.0`. The workflow rewrites `manifest.json` version from the tag, packs `ModalFox-0.1.0.zip`, and attaches it to the GitHub Release.
