# ModalFox

Vim-style modal keybindings for Firefox.

[日本語](README.ja.md)

Two modes, per tab.

- `browser` — initial mode. Every key is passed to the page. `:vim` then `Esc` enters `vim`. Anything else is ignored.
- `vim` — captures keys. `Esc` or `:browser` returns to `browser`. A status line shows `vim` until a colon command starts.

The toolbar button toggles the current tab's mode, or disables the extension. Re-enable it from `about:addons`.

See [SPEC.md](SPEC.md).

## Usage

| key | action |
| --- | --- |
| `:vim` then `Esc` | enter `vim`. The keys also reach the page |
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

## Install

This survives restart. The release `.xpi` is signed by AMO.

1. Download the `.xpi` from [Releases](https://github.com/cympfh/ModalFox/releases/latest).
2. `about:addons` → gear → Install Add-on From File.

Temporary load from `about:debugging` disappears on restart.

## Release

Push a tag `v0.1.0`. The workflow rewrites `manifest.json` version from the tag, signs it as an unlisted AMO add-on, and attaches `ModalFox-0.1.0.xpi` to the GitHub Release.
