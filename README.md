# Joris Playlist Sorter for YouTube

[![Available in the Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Add%20to%20browser-4285F4?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ojjhodbdihkagoblpkclbofmncmhghnd)
[![Buy me a coffee](https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/joris2777)

YouTube's **Save to playlist** dialog lists your playlists in "recently used" order, so with dozens of playlists you end up scrolling to find the right one. This browser extension fixes that:

- **Sorts playlists A–Z** (case-insensitive, with natural number order: "Part 2" before "Part 10"). "Watch later" stays on top.
- **Adds a filter box** that's focused as soon as the dialog opens. Type part of a name to narrow the list.
- After typing, **Enter** ticks the first matching playlist. **Esc** closes the dialog as usual.
- **↗ on each playlist** opens that playlist in a new tab, so you can look through it without leaving the video. It doesn't save the video.
- YouTube's keyboard shortcuts don't fire while you type in the box.

**On your channel's Playlists tab** (youtube.com/@yourname/playlists), where YouTube only sorts by date:

- **A–Z button** sorts all your playlists alphabetically (on by default; click to go back to YouTube's order). The extension loads your whole list automatically, up to 600 playlists.
- **Filter box**: type to narrow the grid, press **Enter** to open the first match.
- On other channels' Playlists tabs it sorts what you've scrolled through.

Sorting is visual only. Your playlists on YouTube are never changed.

If the extension is installed twice (for example from the Chrome Web Store and from GitHub), only one copy runs, and it shows a short note asking you to remove the other.

## Privacy

No data collection, no network requests, no storage, no permissions beyond running on youtube.com. See [PRIVACY.md](PRIVACY.md).

## Install

**Chrome Web Store** (Chrome, Brave, Edge, Opera, Vivaldi): [Add to your browser](https://chromewebstore.google.com/detail/ojjhodbdihkagoblpkclbofmncmhghnd)

**Firefox:** coming soon.

**From source:**
1. Download or clone this repository.
2. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
3. Turn on **Developer mode** and click **Load unpacked**, then choose this folder.

For Firefox, run the build (below) and load `dist/firefox` via `about:debugging` → **This Firefox** → **Load Temporary Add-on**.

## Build store packages

```bash
python build.py
```

This creates:
- `dist/joris-playlist-sorter-chrome-<version>.zip` for the Chrome Web Store and Edge Add-ons
- `dist/joris-playlist-sorter-firefox-<version>.zip` for Firefox Add-ons

## When YouTube changes its layout

YouTube updates its page markup from time to time. If sorting stops working, the selectors to update are in the `LAYOUTS` list at the top of [content.js](content.js). Issues and pull requests are welcome.

## Support

The extension is free and always will be. If it saves you some scrolling, you can [buy me a coffee ☕](https://ko-fi.com/joris2777).

## License

MIT. See [LICENSE](LICENSE).

_Not affiliated with or endorsed by YouTube or Google._
