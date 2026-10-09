## インストール

再起動後も残す。

1. [Release](https://github.com/cympfh/ModalFox/releases/latest) の `.xpi` を落とす
2. `about:config` で `xpinstall.signatures.required` を `false`。効くのは Developer Edition と Nightly。通常版は無視する
3. `about:addons` → 歯車 → ファイルからアドオンをインストール

通常版で残すなら AMO の署名が要る。未署名のファイルインストールは拒否される。

`about:debugging` の一時読み込みは再起動で消える。

## リリース

タグ `v0.1.0` を推す。workflow が manifest の version をタグから書き換え、`ModalFox-0.1.0.xpi` を GitHub Release に付ける。
