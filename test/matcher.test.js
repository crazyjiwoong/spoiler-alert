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

test('ignores accents', () => {
  assert.equal(hit(['Pokemon'], 'Pokémon Legends Z-A ending'), 'Pokemon');
  assert.equal(hit(['Pokémon'], 'POKEMON leak'), 'Pokémon');
});

test('Latin keywords match whole words only', () => {
  assert.equal(hit(['Control'], 'Best PS5 controller settings'), null);
  assert.equal(hit(['Control'], 'Control 2 ending explained'), 'Control');
  assert.equal(hit(['Inside'], 'Inside the new Apple campus'), 'Inside');
  assert.equal(hit(['Halo'], 'Halos and horns'), null);
  assert.equal(hit(['GTA 6'], 'GTA 60 fps mod'), null);
  assert.equal(hit(['GTA 6'], 'GTA6 trailer 3 breakdown'), 'GTA 6');
  assert.equal(hit(['Final Fantasy VII'], 'Final Fantasy VIII remaster'), null);
  assert.equal(hit(['Final Fantasy VII'], 'Final Fantasy VII Rebirth finale'), 'Final Fantasy VII');
});

test('Latin keywords next to Korean text still match', () => {
  assert.equal(hit(['Elden Ring'], '엘든링(Elden Ring) 최종 보스'), 'Elden Ring');
  assert.equal(hit(['Elden Ring'], '엘든링Elden Ring 공략'), 'Elden Ring');
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
