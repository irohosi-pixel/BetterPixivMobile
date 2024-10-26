# BetterPixivMobile

[English](https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/README.md) | 日本語

Pixivの閲覧をもっと便利・快適にします。

> [!IMPORTANT]  
> これはBetterPixivのモバイル版で、pixivのモバイル版ウェブサイトでのみ動作します！  
> デスクトップ版は現在開発中です<!-- [ここ](https://github.com/irohosi-pixel/BetterPixiv)からどうぞ -->。

リンク集  
~~GreasyFork~~ | [GitHub](https://github.com/irohosi-pixel/BetterPixivMobile)

## 機能

- 広告非表示
- 検索強化(ブックマーク数によるフィルタ)
- 画像拡大時のページめくり
- ブックマーク追加強化

## インストール必要要件

> [!IMPORTANT]  
> 動作確認が取れたもののみを掲載しています。  
> ユーザースクリプトをインストールして実行できる環境がそろっている場合、下記以外の環境でも動作する可能性があります。

### Android

- アプリ: [Firefox Android](https://play.google.com/store/apps/details?id=org.mozilla.firefox)
- Firefox Android アドオン: [Violentmonkey](https://addons.mozilla.org/ja/android/addon/violentmonkey/) または [Tampermonkey](https://addons.mozilla.org/ja/android/addon/tampermonkey/)

## インストール

以下のリンクをクリックしてインストールページを開きます。

~~Install from GreasyFork~~ | [Install from GitHub](https://raw.githubusercontent.com/irohosi-pixel/BetterPixivMobile/refs/heads/main/dist/BetterPixivMobile.user.js)

## 自分でビルドする

### Bunをインストール

#### Windows

```cmd
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### Linux & MacOS

```bash
curl -fsSL https://bun.sh/install | bash
```

### 開発プレビューの起動

```bash
bun run dev
```

### ビルド

```bash
bun run build
```

### ビルドしたスクリプトをインストール

```bash
bun run preview
```

## 免責事項

BetterPixivMobileはピクシブ株式会社の承認を受けたものではありません。

色星ぴくせるは本スクリプトの使用または本スクリプトの不具合によって生じたいかなる損害についても責任を負いません。

また、本スクリプトは予告なしに更新の停止や公開の停止を行うことがございます。

## Todo リスト

- [x] 設定画面
- [x] 広告非表示
- [x] 検索強化(ブックマーク数によるフィルタ)
- [x] 画像拡大時のページめくり
- [x] ブックマーク追加強化
- [ ] ダウンロード機能 (1ページイラスト、複数ページイラスト・漫画、うごいら[zip&gif])
- [ ] 対応言語の追加

## 作者

- 色星ぴくせる
- Eメール: `irohosi.pixel{at}gmail.com` (`{at}`を`@`に変えてください)
- X: [@irohosi_pixel](https://x.com/irohosi_pixel)

## ライセンス

[GPLv3](https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/LICENSE)
