開発者の開発メモです！


# TODO
* テキスト -> ngview用htmlの変換機構作る
* ちゃんとクラスごとにファイルわける、confをわかりやすくする
* 各機能を盛り込んだサンプル作る
	- まず機能の使い方思い出す
	- サンプル1. htmlに対してngviewを適用、普通のウェブページを印象的にするサンプル
	- サンプル2. バリバリのノベルゲーム
* logを綺麗に消したら公開？

## ngview用htmlの変換機構
* loadScriptAndPlayPage
	- scriptToHTML でhtmlに変換、loadHtmlAndPlayPage へ渡す
* scriptToHTML(text, format)
	- 面倒なので、とりあえず行ごとにspanする頭悪いのを書けば良さそう。
		- 本当は吉里吉里を作りたいが。。
* ScriptToHTML.convertSimpleFormat
	- 二行以上の改行を見つけて`<div></div>` で区切る。
		- ここにclass nameとかも付与したい、class_nameをsetする専用のタグ用意する？ ここは後回しか。
	- 行ごとに`<span></span><br>`する
