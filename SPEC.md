# ModalFox

[Japanese](SPEC.ja.md)

## Modes

- `browser` — initial. Keys are not captured.
- `vim` — captures keys only after entry.
- Hint and command are temporary states inside `vim`. They return to `vim`.
- `Esc` in `vim` drops the temporary state and returns to `browser`.

## Memory

`:set scope=tab|global|domain`. `:set scope` shows the value. Default is `tab`. The setting and remembered modes survive restart.

- `tab` — per tab. Lost when the tab dies.
- `global` — one mode, applied to every tab. The mode is kept.
- `domain` — per hostname. `www` is separate. An unknown host is `browser`. A page with no host is tab-local until a host appears.

Switching scope seeds the new unit from the current tab. The popup writes to the same unit.

## browser

- Every key is passed to the page. Do not `preventDefault`.
- Characters after a half-width `:` are read and also delivered to the page. The command line is shown.
- `:vim` then `Enter` enters `vim`. `Esc` closes the command line. Anything else is ignored.
- Ignore full-width `：`.

## Entry

- `:vim` then `Enter` enters `vim`.
- `:browser` returns to `browser`.
- No aliases. A unique prefix runs.

## vim keys

- Scroll: `h` `j` `k` `l`, `d` `u` half page, `gg` `G`.
- History: `H` back, `L` forward. Once.
- Tabs: `J` next (down), `K` previous (up), `x` close, `X` restore, `t` new.
- Hints: `f` same tab, `F` new tab.
- Hint characters: `asdfgqwertzxcvb`, assigned in that order. No shuffle. One character up to 15 targets, two after that. Short labels are used first.
- `yy` copies the current URL. No notification.
- `p` opens the clipboard in the current tab. `P` opens a new tab. Non-URL text is a search. Empty does nothing.
- Unknown keys are ignored. Mode stays.

## Commands

- A unique prefix runs. Candidates sit above the command line. `Tab` completes the only candidate.
- `:set scope=tab|global|domain`. `:set scope` shows the value. Usable from both modes.
- `:browser` `:open` `:tabopen` `:back` `:forward`.
- `:back` `:forward` — default 1. Positive integer. `0`, negative, and non-numeric are errors and do not move.

## Inheritance

- In `tab`, `t` `F` `P` `:tabopen` opened from `vim` stay in `vim`. `X` restores `vim`.
- In `global`, a new tab uses the shared mode.
- In `domain`, the host memory wins. A hostless new tab inherits the current mode.
- `target=_blank` and normal clicks use the scope's default.

## Out of scope

- Operator pending, marks, visual mode.
- UI other than the command line and the brief mode name.
- `about:` and AMO. Content scripts do not run there.
