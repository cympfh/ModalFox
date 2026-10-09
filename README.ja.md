# ModalFox

Firefox の vim 風キーバインド。

[English](README.md)

モードは二つ。タブごと。

- `browser` — 初期モード。キーは全部ページに通す。`:vim` のあと `Enter` で `vim` に入る。`Esc` はコマンド行を閉じる
- `vim` — キーを奪う。`Esc` か `:browser` で `browser` に戻る。ページ下に `vim` を出す。コロン入力中は消える

ツールバーのアイコンで、現在タブのモード切替と拡張の無効化ができる。戻すのは `about:addons`。

仕様は [SPEC.ja.md](SPEC.ja.md)。

## 使い方

| キー | 動作 |
| --- | --- |
| `:vim` のあと `Enter` | `vim` に入る。文字はページにも届く |
| `Esc` `:browser` | `browser` に戻る |
| `h` `j` `k` `l` | スクロール |
| `d` `u` | 半ページ |
| `gg` `G` | 先頭、末尾 |
| `H` `L` | 戻る、進む |
| `J` `K` | 次のタブ（下）、前のタブ（上） |
| `x` `X` | 閉じる、復元 |
| `t` | 新規タブ。`vim` のまま |
| `f` `F` | ヒント。同一タブ / 新規タブ |
| `yy` | URL をコピー |
| `p` `P` | クリップボードを開く。現在タブ / 新規タブ |
| `:open` | 現在タブで開く。URL でなければ検索 |
| `:tabopen` | 新規タブで開く。URL でなければ検索 |
| `:back` `:forward` | 履歴。引数は省略で1。正の整数 |

ヒント文字は `asdfgqwertzxcvb`。この順で割り当てる。

## インストール

再起動後も残す。Release の `.xpi` は AMO の署名済み。

1. [Release](https://github.com/cympfh/ModalFox/releases/latest) の `.xpi` を落とす
2. `about:addons` → 歯車 → ファイルからアドオンをインストール

`about:debugging` の一時読み込みは再起動で消える。

## リリース

タグ `v0.1.0` を推す。workflow が manifest の version をタグから書き換え、AMO で unlisted 署名し、`ModalFox-0.1.0.xpi` を GitHub Release に付ける。
