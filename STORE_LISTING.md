# Store listing — copy and paste

## Name
Joris Playlist Sorter for YouTube

## Short description (Chrome limit: 132 characters)
Sort YouTube playlists A–Z in the "Save to" dialog and on your Playlists tab, with a quick filter box. No data collected.

## Detailed description
Tired of scrolling through dozens of playlists every time you save a video?

YouTube's "Save to playlist" dialog shows your playlists in recently-used order, so the one you want is never where you expect. Joris Playlist Sorter for YouTube fixes that:

• Sorts your playlists alphabetically (A–Z), with natural number order ("Part 2" before "Part 10")
• Keeps "Watch later" at the top
• Adds a filter box. Just start typing to narrow the list
• Press Enter to tick the first match
• YouTube's keyboard shortcuts stay out of the way while you type

NEW: your channel's Playlists tab, too
YouTube only sorts that page by date. The extension adds:
• An A–Z button that sorts all your playlists alphabetically (it loads your whole list for you)
• A filter box. Type to narrow the grid, press Enter to open the first match

Private by design:
• Collects no data
• Makes no network requests
• Stores nothing
• Only runs on youtube.com
• Sorting is visual only. Your playlists are never changed

Free and open source (MIT license).

Not affiliated with or endorsed by YouTube or Google.

## Category
- Chrome Web Store: Productivity → Tools
- Edge Add-ons: Productivity
- Firefox Add-ons: Photos, Music & Videos (or Other)

## Language
English

---

## Chrome Web Store: "Privacy practices" tab

**Single purpose description:**
Makes YouTube's "Save to playlist" dialog easier to use by sorting playlists alphabetically and adding a filter box.

**Host permission justification (https://www.youtube.com/\*):**
The extension needs to run on YouTube pages to sort and filter the playlist list inside YouTube's "Save to playlist" dialog. It only reads playlist names shown on the page and does not send them anywhere.

**Remote code:** No, I am not using remote code.

**Data usage:** Check nothing (the extension collects no user data). Then tick all three certifications:
- I do not sell or transfer user data to third parties…
- I do not use or transfer user data for purposes unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** link to PRIVACY.md on GitHub, e.g.
`https://github.com/joris2777/joris-playlist-sorter-for-youtube/blob/main/PRIVACY.md`

---

## Firefox Add-ons: notes for reviewers
No build step or minification. The submitted files are the source. The extension runs a content script on youtube.com that reorders the "Save to playlist" list with CSS `order` and adds a filter input. No network requests, no storage.

---

## Images you need to make yourself
Screenshots must show the real extension, so take them on your own signed-in YouTube:

- **Screenshots:** 1–5 images, **1280×800** (or 640×400) PNG/JPG.
  1. The Save dialog with sorted playlists
  2. The filter box with something typed in it
  Tip: set the browser window to about 1280×800, open the Save dialog, press Win+Shift+S, then crop or resize to exactly 1280×800 (Paint → Resize → by pixels, untick "Maintain aspect ratio" only if it's already close).
- **Store icon:** use `store-assets/icon512.png` (Edge/Firefox) or `icons/icon128.png` (Chrome).
- **Small promo tile (Chrome, optional but recommended):** 440×280.
