# BetterPixivMobile

English | [日本語](https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/README_ja.md)

Make browsing Pixiv more convenient and comfortable.

> [!IMPORTANT]  
> This is mobile version of BetterPixiv, so it work only on pixiv website on mobile device!  
> Desktop version is currently under development<!-- [here](https://github.com/irohosi-pixel/BetterPixiv) -->.

Links  
[GreasyFork](https://greasyfork.org/scripts/514158-betterpixivmobile) | [GitHub](https://github.com/irohosi-pixel/BetterPixivMobile)

## Features

- Ad Remover
- Search Enhancement(Favorites Num Filter)
- Paging when displaying enlarged images
- Bookmark Add Enhancement

## Installation Requirements

> [!IMPORTANT]  
> Only those that have been confirmed to work are listed.  
> If you have an environment where user scripts can be installed and executed, it may work in environments other than those listed below.

### Android

- App: [Firefox Mobile](https://play.google.com/store/apps/details?id=org.mozilla.firefox)
- Firefox Android Add-on: [Violentmonkey](https://addons.mozilla.org/ja/android/addon/violentmonkey/) or [Tampermonkey](https://addons.mozilla.org/ja/android/addon/tampermonkey/)

## Installation

Click a link below to open install page.

[Install from GreasyFork](https://update.greasyfork.org/scripts/514158/BetterPixivMobile.user.js) | [Install from GitHub](https://raw.githubusercontent.com/irohosi-pixel/BetterPixivMobile/refs/heads/main/dist/BetterPixivMobile.user.js)

## Build yourself

### Install Bun

#### Windows

```cmd
powershell -c "irm bun.sh/install.ps1 | iex"
```

#### Linux & MacOS

```bash
curl -fsSL https://bun.sh/install | bash
```

### Launch developmental preview

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Install builded script

```bash
bun run preview
```

## Disclaimer

BetterPixivMobile is not approved by Pixiv Inc.

Irohoshi Pixel is not responsible for any damage caused by the use of this script or any malfunction of this script.

In addition, this script may stop updating or stop releasing without prior notice.

## Todo List

- [x] SettingPanel
- [x] AdRemover
- [x] Search Enhancement(Bookmarks Num Filter)
- [x] Paging when displaying enlarged images
- [x] Bookmark Add Enhancement
- [ ] Download Feature (single picture, multi pictures & manga, ugoira[zip&gif])
- [ ] Addition of supported languages

## Author

- Irohosi Pixel(色星ぴくせる)
- Email: `irohosi.pixel{at}gmail.com` (Replace `{at}` to `@`)
- X: [@irohosi_pixel](https://x.com/irohosi_pixel)

## License

[GPL-3.0](https://github.com/irohosi-pixel/BetterPixivMobile/blob/main/LICENSE)
