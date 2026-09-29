# ⚠ Spoiler Alert

**English** · [한국어](README.ko.md)

A browser extension for people who haven't finished the game yet.

Add the games, shows and movies you don't want spoiled. Any YouTube video that mentions them gets its **thumbnail taped over with SPOILER ALERT tape** and its **title replaced with `⚠ SPOILER ALERT`**.

Nothing is removed or locked. Covered videos still open normally when you click them. The point is that you never see a spoiler *by accident* while scrolling.

## What gets covered

| Where | What happens |
| --- | --- |
| Home feed, search results, channel pages, playlists | Thumbnail taped over, title replaced, description snippets and chapter previews hidden |
| "Up next" sidebar and end-screen suggestions | Thumbnail taped over, title replaced |
| Shorts shelves | Thumbnail taped over, title replaced |
| Shorts feed (`/shorts/…`) | The whole Short is covered and autoplay is paused. Click **Show anyway** to watch it |
| Watch page | If the video matches, the description is collapsed behind a **Show description** button and chapter names in the player are hidden |
| Notifications | Thumbnail taped over, notification text replaced |
| Hovering a covered thumbnail | The inline preview doesn't play |

## How matching works

- **Case, spacing, punctuation and accents are ignored**, and the keyword can appear anywhere, even inside a longer word. `Elden Ring` also matches `ELDEN-RING`, `EldenRing`, `#EldenRingDLC` and `eldenringbuild`. `Pokemon` also matches `Pokémon`. This catches titles and hashtags written without spaces.
- Because matching is this loose, very short or common keywords cover a lot: `Control` also covers `controller` videos. Prefer a full name (`Control 2`, `Control game`) or a character name.
- The title, channel name and description snippet are checked. A video that never names the game in text can't be detected.

Tip: add the character names, DLC names and nicknames people use too (e.g. `Elden Ring, Shadow of the Erdtree, Malenia`).

## Install

The extension isn't on the Chrome Web Store yet, so install it in developer mode. It works in Chrome, Edge, Brave, Opera, Vivaldi and other Chromium browsers.

1. Download this repository (**Code → Download ZIP**, then unzip), or `git clone` it.
2. Open `chrome://extensions` (`edge://extensions` in Edge).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that contains `manifest.json`.
5. Pin **Spoiler Alert** from the puzzle-piece menu so it's one click away.

To update, pull or re-download the files, then click the ↻ reload button on the extension's card and refresh your YouTube tabs.

## Usage

Click the toolbar icon:

- Type a name and press **Add**. Separate several with commas.
- Click **×** on a keyword to remove it.
- Use the switch in the top right to pause blocking.

Changes apply to open YouTube tabs immediately and sync across your devices through your browser account.

The interface is in English, or in Korean when the browser is set to Korean.

## Privacy

Spoiler Alert has no servers, no analytics and no network requests. It only asks for the `storage` permission, which it uses to save your keyword list with your browser's built-in sync. It only runs on `youtube.com`.

## Known limitations

- The title and comments on a watch page you open are left visible on purpose. Only the description is collapsed.
- Search autocomplete suggestions aren't covered.
- YouTube changes its markup often. If something stops being covered, the selectors at the top of [`src/content.js`](src/content.js) (`RENDERERS`, `THUMBS`, `TITLES`) are usually all that needs updating. Issues and PRs are welcome.

## Development

```
manifest.json      Extension manifest (Manifest V3)
src/matcher.js     Keyword matching
src/content.js     Finds video cards on YouTube and covers the matching ones
src/content.css    Tape, title and Shorts overlay styles
popup/             Keyword manager shown from the toolbar icon
_locales/          English and Korean UI strings
test/              Unit tests for the matcher
```

Run the tests (Node 18+):

```
npm test
```
