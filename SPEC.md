# ModalFox

[Japanese](SPEC.ja.md)

## Modes

Per tab.

- `browser` — initial. Keys are not captured.
- `vim` — captures keys only after entry.
- Hint and command are temporary states inside `vim`. They return to `vim`.
- `Esc` in `vim` drops the temporary state and returns to `browser`.

## browser

- Watch half-width `:` only. Do not `preventDefault`. The page receives it too.
- Same in an input. The character is inserted and the command line opens.
- `Esc` drops the command line only. The inserted character stays. Mode stays `browser`.
- Ignore full-width `：`.
- The only command is `:vim`. Anything else is an error. Stay in `browser`.

## Entry

- `:vim` enters `vim`.
- `:browser` returns to `browser`.
- No aliases.

## vim keys

- Scroll: `h` `j` `k` `l`, `d` `u` half page, `gg` `G`.
- History: `H` back, `L` forward. Once.
- Tabs: `J` `K`, `x` close, `X` restore, `t` new.
- Hints: `f` same tab, `F` new tab.
- Hint characters: `asdfgqwertzxcvb`, assigned in that order. No shuffle. One character up to 15 targets, two after that. Short labels are used first.
- `yy` copies the current URL. No notification.
- `p` opens the clipboard in the current tab. `P` opens a new tab. Non-URL text is a search. Empty does nothing.
- Unknown keys are ignored. Mode stays.

## vim commands

- `:browser`
- `:open` — current tab. Non-URL text is a search.
- `:tabopen` — new tab.
- `:back` `:forward` — default 1. Positive integer. `0`, negative, and non-numeric are errors and do not move. If history is shorter, go as far as it exists.

## Inheritance

- A tab ModalFox opens from `vim` stays in `vim`: `t` `F` `P` `:tabopen`.
- The original tab stays in `vim`.
- `target=_blank` and normal clicks stay in `browser`.

## Out of scope

- Operator pending, marks, visual mode, per-site ignore.
- UI other than the command line.
- `about:` and AMO. Content scripts do not run there.
