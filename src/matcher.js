// Keyword matching, shared by the content script and the unit tests.
//
// Case, accents, spacing and punctuation are ignored on both sides and the keyword can appear
// anywhere, so "Elden Ring" matches "ELDEN-RING", "#EldenRingDLC" and "eldenringbuild", and
// "Pokemon" matches "Pokémon".
(() => {
  'use strict';

  const normalize = (s) =>
    (s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s\p{P}\p{S}]+/gu, '');

  function compile(keywords) {
    return (keywords || []).map((raw) => ({ raw, norm: normalize(raw) })).filter((n) => n.norm);
  }

  // Returns the first keyword (as the user typed it) found in `text`, or null.
  function findKeyword(needles, text) {
    if (!needles.length || !text) return null;
    const hay = normalize(text);
    const hit = needles.find((n) => hay.includes(n.norm));
    return hit ? hit.raw : null;
  }

  const api = { compile, findKeyword };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.SpoilerMatcher = api;
})();
