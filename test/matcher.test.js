const test = require('node:test');
const assert = require('node:assert/strict');
const { compile, findKeyword } = require('../src/matcher.js');

const hit = (keywords, text) => findKeyword(compile(keywords), text);

test('ignores case, spacing and punctuation', () => {
  for (const title of [
    'Elden Ring - Malenia boss fight',
    'ELDEN RING: Shadow of the Erdtree',
    'Best build in EldenRing',
    'my run #eldenring #shorts',
    'elden-ring speedrun',
    "Elden Ring's secret ending",
  ]) {
    assert.equal(hit(['Elden Ring'], title), 'Elden Ring', title);
  }
});

test('matches inside longer words and run-together titles', () => {
  assert.equal(hit(['Elden Ring'], '#EldenRingDLC ending'), 'Elden Ring');
  assert.equal(hit(['Elden Ring'], 'eldenringbuildguide'), 'Elden Ring');
  assert.equal(hit(['GTA 6'], 'GTA6trailer'), 'GTA 6');
  assert.equal(hit(['Elden Ring'], '엘든링(EldenRing) 최종 보스'), 'Elden Ring');
});

test('ignores accents', () => {
  assert.equal(hit(['Pokemon'], 'Pokémon Legends Z-A ending'), 'Pokemon');
  assert.equal(hit(['Pokémon'], 'POKEMON leak'), 'Pokémon');
});

test('Korean keywords match inside words and ignore spacing', () => {
  assert.equal(hit(['엘든 링'], '엘든링을 처음 해봤다'), '엘든 링');
  assert.equal(hit(['엘든링'], '[엘든 링] 말레니아 공략'), '엘든링');
  assert.equal(hit(['오징어 게임'], '오징어게임3 결말'), '오징어 게임');
  assert.equal(hit(['엘든 링'], '다크소울 3 공략'), null);
});

test('returns the keyword as the user typed it and skips empty ones', () => {
  assert.equal(hit(['  ', 'The Last of Us'], 'the last of us part 3?'), 'The Last of Us');
  assert.equal(hit([], 'anything'), null);
  assert.equal(hit(['!!!'], 'anything!!!'), null);
});
