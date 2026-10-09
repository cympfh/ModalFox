# ModalFox

Vim-style modal keybindings for Firefox.

[日本語](README.ja.md)

Two modes, per tab.

- `browser` — initial mode. All keys are passed to the page. `:vim` enters `vim`.
- `vim` — captures keys. `Esc` or `:browser` returns to `browser`.

The toolbar button toggles the current tab's mode, or disables the extension. Re-enable it from `about:addons`.

See [SPEC.md](SPEC.md).

## Usage

| key | action |
| --- | --- |
| `:vim` | enter `vim` |
| `Esc` `:browser` | return to `browser` |
| `h` `j` `k` `l` | scroll |
| `d` `u` | half page |
| `gg` `G` | top, bottom |
| `H` `L` | back, forward |
| `J` `K` | next tab (down), previous tab (up) |
| `x` `X` | close, restore |
| `t` | new tab, stays in `vim` |
| `f` `F` | hint, same tab / new tab |
| `yy` | copy URL |
| `p` `P` | open clipboard, current tab / new tab |
| `:open` | open or search in the current tab |
| `:tabopen` | open or search in a new tab |
| `:back` `:forward` | history. Optional count, default 1 |

Hint characters are `asdfgqwertzxcvb`, assigned in that order.

## Load

`about:debugging` → This Firefox → Load Temporary Add-on → `manifest.json`.

## Release

Push a tag `v0.1.0`. The workflow rewrites `manifest.json` version from the tag, packs `ModalFox-0.1.0.zip`, and attaches it to the GitHub Release.
