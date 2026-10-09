# ModalFox

Firefox の vim 風キーバインド。

[English](README.md)

モードは二つ。タブごと。

- `browser` — 初期。キーは奪わない。半角 `:` でコマンド行が開き、文字はページにも届く。`:vim` で `vim` に入る
- `vim` — キーを奪う。`Esc` か `:browser` で `browser` に戻る

ヒントとコマンド行はモードではない。`vim` の中の一時状態。

仕様は [SPEC.ja.md](SPEC.ja.md)。

## 使い方

| キー | 動作 |
| --- | --- |
| `:vim` | `vim` に入る |
| `Esc` `:browser` | `browser` に戻る |
| `h` `j` `k` `l` | スクロール |
| `d` `u` | 半ページ |
| `gg` `G` | 先頭、末尾 |
| `H` `L` | 戻る、進む |
| `J` `K` | 右のタブ、左のタブ |
| `x` `X` | 閉じる、復元 |
| `t` | 新規タブ。`vim` のまま |
| `f` `F` | ヒント。同一タブ / 新規タブ |
| `yy` | URL をコピー |
| `p` `P` | クリップボードを開く。現在タブ / 新規タブ |
| `:open` | 現在タブで開く。URL でなければ検索 |
| `:tabopen` | 新規タブで開く。URL でなければ検索 |
| `:back` `:forward` | 履歴。引数は省略で1。正の整数 |

ヒント文字は `asdfgqwertzxcvb`。この順で割り当てる。

## 読み込み

`about:debugging` → This Firefox → Load Temporary Add-on → `manifest.json`。

## リリース

タグ `v0.1.0` を推す。workflow が manifest の version をタグから書き換え、`ModalFox-0.1.0.zip` を GitHub Release に付ける。
