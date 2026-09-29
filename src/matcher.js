// Keyword matching, shared by the content script and the unit tests.
//
// - Case, accents and spacing are ignored: "Pokemon" matches "Pokémon",
//   "Elden Ring" matches "ELDEN-RING", "EldenRing" and "#eldenring".
// - Latin/number keywords match whole words only, so "Control" (the game)
//   does not match "controller" and "GTA 6" does not match "GTA 60".
// - Keywords in Korean, Chinese or Japanese match anywhere, since those
//   scripts attach particles directly to words ("엘든링을", "엘든 링의").
(() => {
  'use strict';

  const CJK = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const LATIN_WORD = '[\\p{Script=Latin}\\p{N}]';

  const fold = (s) =>
    (s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .normalize('NFC')
      .toLowerCase();

  const compact = (s) => s.replace(/[\s\p{P}\p{S}]+/gu, '');

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function makeNeedle(raw) {
    const folded = fold(raw).trim();
    if (!folded) return null;

    if (CJK.test(folded)) {
      const needle = compact(folded);
      return needle ? { raw, test: (hay) => hay.compact.includes(needle) } : null;
    }

    const tokens = folded.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    if (!tokens.length) return null;
    const re = new RegExp(
      `(?<!${LATIN_WORD})` + tokens.map(escapeRe).join('[^\\p{L}\\p{N}]*') + `(?!${LATIN_WORD})`,
      'u'
    );
    return { raw, test: (hay) => re.test(hay.folded) };
  }

  function compile(keywords) {
    return (keywords || []).map(makeNeedle).filter(Boolean);
  }

  // Returns the first keyword (as the user typed it) found in `text`, or null.
  function findKeyword(needles, text) {
    if (!needles.length || !text) return null;
    const folded = fold(text);
    let compacted;
    const hay = {
      folded,
      get compact() {
        return (compacted ??= compact(folded));
      },
    };
    const hit = needles.find((n) => n.test(hay));
    return hit ? hit.raw : null;
  }

  const api = { compile, findKeyword };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.SpoilerMatcher = api;
})();
