# ModalFox

Firefox の vim 風キーバインド。

[English](README.md)

モードは二つ。タブごと。

- `browser` — 初期モード。キーは全部ページに通す。`:vim` のあと `Esc` で `vim` に入る。それ以外は無視
- `vim` — キーを奪う。`Esc` か `:browser` で `browser` に戻る

ツールバーのアイコンで、現在タブのモード切替と拡張の無効化ができる。戻すのは `about:addons`。

仕様は [SPEC.ja.md](SPEC.ja.md)。

## 使い方

| キー | 動作 |
| --- | --- |
| `:vim` のあと `Esc` | `vim` に入る。文字はページにも届く |
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

再起動後も残す。

1. [Release](https://github.com/cympfh/ModalFox/releases/latest) の zip を `.xpi` にリネーム
2. `about:config` で `xpinstall.signatures.required` を `false`。効くのは Developer Edition と Nightly。通常版は無視する
3. `about:addons` → 歯車 → ファイルからアドオンをインストール

通常版で残すなら AMO の署名が要る。未署名のファイルインストールは拒否される。

`about:debugging` の一時読み込みは再起動で消える。

## リリース

タグ `v0.1.0` を推す。workflow が manifest の version をタグから書き換え、`ModalFox-0.1.0.zip` を GitHub Release に付ける。
