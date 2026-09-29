(() => {
  'use strict';

  // 영상 하나를 나타내는 카드들 (홈, 검색, 추천 사이드바, 쇼츠 선반, 채널, 재생목록, 알림, 종료 화면)
  const RENDERERS = [
    'ytd-rich-item-renderer',
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-playlist-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-movie-renderer',
    'ytd-movie-renderer',
    'ytd-reel-item-renderer',
    'ytd-rich-grid-slim-media',
    'ytd-channel-video-player-renderer',
    'ytd-notification-renderer',
    'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',
    'ytm-video-with-context-renderer',
    'ytm-compact-video-renderer',
    'ytm-reel-item-renderer',
    '.ytp-videowall-still',
    '.ytp-ce-video',
    '.ytp-autonav-endscreen-upnext-container',
  ].join(',');

  const THUMBS = [
    'ytd-thumbnail',
    'ytd-playlist-thumbnail',
    'yt-thumbnail-view-model',
    'yt-collection-thumbnail-view-model',
    '.yt-lockup-view-model__content-image',
    '.yt-lockup-view-model-wiz__content-image',
    '.ytLockupViewModelContentImage',
    '.shortsLockupViewModelHostThumbnailContainer',
    'a.reel-item-endpoint',
    'ytm-thumbnail-cover',
    '.media-item-thumbnail-container',
    'ytd-notification-renderer .thumbnail-container',
    '.ytp-videowall-still-image',
    '.ytp-autonav-endscreen-upnext-thumbnail',
    '.ytp-ce-covering-image',
  ].join(',');

  const TITLES = [
    '#video-title',
    '.yt-lockup-metadata-view-model__title',
    '.yt-lockup-metadata-view-model-wiz__title',
    '.ytLockupMetadataViewModelTitle',
    '.shortsLockupViewModelHostMetadataTitle',
    '.shortsLockupViewModelHostOutsideMetadataTitle',
    '.media-item-headline',
    'ytd-notification-renderer .message',
    '.ytp-videowall-still-info-title',
    '.ytp-autonav-endscreen-upnext-title',
    '.ytp-ce-video-title',
  ].join(',');

  // 검색 결과의 설명 스니펫, 챕터 목록처럼 내용이 드러나는 부분은 통째로 숨긴다
  // 제목 외의 줄(재생목록 속 영상 제목 등) 중 키워드가 들어간 줄은 숨긴다
  const ROWS = [
    '[class*="MetadataViewModelMetadataRow"]',
    '[class*="metadata-view-model__metadata-row"]',
    '#metadata-line',
    'ytd-child-video-renderer',
  ].join(',');

  const HIDE = [
    '#description-text',
    '[class*="metadata-snippet"]',
    'ytd-expandable-metadata-renderer',
    '#expandable-metadata',
  ].join(',');

  // 쇼츠 플레이어 (위아래로 넘기다 자동 재생되는 쇼츠)
  const REELS = 'ytd-reel-video-renderer';
  // 쇼츠 안에는 플레이어 버튼 문구("이 동영상에 좋아요 표시" 등)도 있으므로 제목·채널·해시태그 영역만 검사한다
  const REEL_META = [
    'yt-reel-metapanel-view-model',
    '.ytShortsVideoTitleViewModelShortsVideoTitle',
    'yt-shorts-video-title-view-model',
    'ytd-reel-player-header-renderer',
    '#metapanel',
  ].join(',');

  // 영상 페이지의 설명란
  const WATCH_META = 'ytd-watch-metadata';
  const WATCH_DESC = [
    'ytd-watch-metadata #description',
    '#description-inline-expander',
    'ytd-video-secondary-info-renderer #description',
  ].join(',');

  let enabled = true;
  let needles = []; // [{ raw, norm }]
  let version = 0;
  const revealedShorts = new Set();
  const revealedWatch = new Set();

  const normalize = (s) =>
    (s || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s\-_:·.,'"’‘“”!?()[\]{}|/\\~]+/g, '');

  function setSettings({ enabled: on = true, keywords = [] }) {
    enabled = on !== false;
    needles = keywords
      .map((raw) => ({ raw, norm: normalize(raw) }))
      .filter((n) => n.norm);
    version++;
    scheduleScan();
  }

  function findHit(text) {
    if (!enabled || !needles.length) return null;
    const hay = normalize(text);
    const hit = needles.find((n) => hay.includes(n.norm));
    return hit ? hit.raw : null;
  }

  function readText(el) {
    let text = el.textContent || '';
    const own = el.getAttribute('aria-label') || el.getAttribute('title');
    if (own) text += ' ' + own;
    for (const a of el.querySelectorAll('a[title], a[aria-label], h3[title], h3[aria-label]')) {
      text += ' ' + (a.getAttribute('title') || '') + ' ' + (a.getAttribute('aria-label') || '');
    }
    return text;
  }

  // 중첩된 매치 중 가장 바깥쪽 요소만 남긴다
  function outermost(root, selector) {
    const found = [...root.querySelectorAll(selector)];
    return found.filter((n) => !found.some((o) => o !== n && o.contains(n)));
  }

  function thumbHosts(el) {
    const hosts = outermost(el, THUMBS);
    if (hosts.length) return hosts;
    const img = el.querySelector('img');
    if (!img) return [];
    const link = img.closest('a');
    return [link && el.contains(link) ? link : img.parentElement];
  }

  function ensurePositioned(host) {
    if (getComputedStyle(host).position === 'static') host.classList.add('sa-pos');
  }

  function makeOverlay(className, keyword) {
    const overlay = document.createElement('div');
    overlay.className = className;
    // 모든 문구는 CSS content로 그려서 textContent(=키워드 검사 대상)에 섞이지 않게 한다
    overlay.innerHTML = '<div class="sa-tape sa-tape-1"></div><div class="sa-tape sa-tape-2"></div><div class="sa-kw"></div>';
    overlay.querySelector('.sa-kw').dataset.kw = keyword;
    return overlay;
  }

  function block(el, keyword) {
    el.setAttribute('data-sa-blocked', '');

    for (const host of thumbHosts(el)) {
      let overlay = host.querySelector(':scope > .sa-overlay');
      if (!overlay) {
        ensurePositioned(host);
        overlay = makeOverlay('sa-overlay', keyword);
        host.appendChild(overlay);
      }
      overlay.querySelector('.sa-kw').dataset.kw = keyword;
    }

    for (const title of outermost(el, TITLES)) {
      title.classList.add('sa-title');
      // 마우스를 올렸을 때 뜨는 툴팁으로 원래 제목이 보이지 않게
      if (title.hasAttribute('title')) {
        title.setAttribute('data-sa-orig-title', title.getAttribute('title'));
        title.removeAttribute('title');
      }
    }

    for (const part of el.querySelectorAll(HIDE)) part.classList.add('sa-hidden');
    for (const row of el.querySelectorAll(ROWS)) {
      if (findHit(row.textContent)) row.classList.add('sa-hidden');
    }
  }

  function unblock(el) {
    if (!el.hasAttribute('data-sa-blocked')) return;
    el.removeAttribute('data-sa-blocked');
    for (const overlay of el.querySelectorAll('.sa-overlay')) overlay.remove();
    for (const host of el.querySelectorAll('.sa-pos')) host.classList.remove('sa-pos');
    for (const title of el.querySelectorAll('.sa-title')) {
      title.classList.remove('sa-title');
      const orig = title.getAttribute('data-sa-orig-title');
      if (orig !== null) {
        if (!title.hasAttribute('title')) title.setAttribute('title', orig);
        title.removeAttribute('data-sa-orig-title');
      }
    }
    for (const part of el.querySelectorAll('.sa-hidden')) part.classList.remove('sa-hidden');
  }

  function isIntact(el) {
    return el.querySelector('.sa-overlay') && (!el.querySelector(TITLES) || el.querySelector('.sa-title'));
  }

  function processCard(el) {
    // 카드 안에 또 카드가 있는 경우(예: rich-item > lockup) 바깥 것만 처리
    if (el.parentElement && el.parentElement.closest(RENDERERS)) return;

    const text = readText(el);
    const sig = version + '|' + text;
    if (el.__saSig === sig) {
      // YouTube가 카드 내부를 다시 그리면서 오버레이를 지웠을 수 있다
      if (el.__saHit && !isIntact(el)) block(el, el.__saHit);
      return;
    }
    el.__saSig = sig;
    el.__saHit = findHit(text);
    if (el.__saHit) block(el, el.__saHit);
    else unblock(el);
  }

  // 쇼츠 플레이어의 <video>는 카드 밖에 있을 수도 있다
  function shortsVideos(reel) {
    const inside = [...reel.querySelectorAll('video')];
    return inside.length ? inside : [...document.querySelectorAll('ytd-shorts video, #shorts-player video')];
  }

  function activeReelBlocked() {
    const reel = [...document.querySelectorAll(REELS)].find(isActiveReel);
    return !!(reel && reel.hasAttribute('data-sa-reel-blocked'));
  }

  // 쇼츠 피드에서 지금 화면 가운데에 있는 쇼츠인지
  function isActiveReel(reel) {
    if (reel.hasAttribute('is-active')) return true;
    const r = reel.getBoundingClientRect();
    const y = innerHeight / 2;
    return r.height > 0 && r.top <= y && r.bottom >= y;
  }

  function processReel(reel) {
    const key = isActiveReel(reel) ? location.pathname : null;
    const text = outermost(reel, REEL_META).map(readText).join(' ');
    const sig = version + '|' + key + '|' + text;
    if (reel.__saSig === sig && (!reel.__saHit || reel.querySelector(':scope > .sa-reel-overlay'))) return;
    reel.__saSig = sig;

    const hit = findHit(text);
    reel.__saHit = hit && !(key && revealedShorts.has(key)) ? hit : null;

    let overlay = reel.querySelector(':scope > .sa-reel-overlay');
    if (!reel.__saHit) {
      reel.removeAttribute('data-sa-reel-blocked');
      if (overlay) overlay.remove();
      return;
    }

    reel.setAttribute('data-sa-reel-blocked', '');
    if (!overlay) {
      ensurePositioned(reel);
      overlay = makeOverlay('sa-reel-overlay', reel.__saHit);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sa-reveal';
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        revealedShorts.add(location.pathname);
        reel.__saSig = null;
        processReel(reel);
        const [video] = shortsVideos(reel);
        if (video) video.play().catch(() => {});
      });
      overlay.appendChild(button);
      reel.appendChild(overlay);
    }
    overlay.querySelector('.sa-kw').dataset.kw = reel.__saHit;
    if (key) for (const v of shortsVideos(reel)) if (!v.paused) v.pause();
  }

  // 영상에 들어가도 설명란(+ 챕터 이름)은 키워드가 있으면 접어 둔다
  function processWatch() {
    const meta = location.pathname === '/watch' && document.querySelector(WATCH_META);
    const desc = meta && document.querySelector(WATCH_DESC);
    const id = new URLSearchParams(location.search).get('v');
    const hit = desc && !revealedWatch.has(id) ? findHit(meta.textContent) : null;

    document.documentElement.classList.toggle('sa-watch-guard', !!hit);
    for (const old of document.querySelectorAll('.sa-desc-hidden')) {
      if (old !== desc || !hit) old.classList.remove('sa-desc-hidden');
    }
    for (const gate of document.querySelectorAll('.sa-desc-gate')) {
      if (gate.nextElementSibling !== desc || !hit) gate.remove();
    }
    if (!hit) return;

    desc.classList.add('sa-desc-hidden');
    let gate = desc.previousElementSibling;
    if (!gate || !gate.classList.contains('sa-desc-gate')) {
      gate = document.createElement('button');
      gate.type = 'button';
      gate.className = 'sa-desc-gate';
      gate.addEventListener('click', () => {
        revealedWatch.add(new URLSearchParams(location.search).get('v'));
        processWatch();
      });
      desc.before(gate);
    }
    gate.dataset.kw = hit;
  }

  function scan() {
    scheduled = false;
    for (const el of document.querySelectorAll(RENDERERS)) processCard(el);
    for (const reel of document.querySelectorAll(REELS)) processReel(reel);
    processWatch();
  }

  // requestAnimationFrame은 다음 화면 그리기 직전에 실행되므로 새 카드가 가려지기 전에 보이는 일이 거의 없다
  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(scan);
  }

  new MutationObserver(scheduleScan).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['title', 'href', 'aria-label', 'is-active'],
  });
  document.addEventListener('yt-navigate-finish', scheduleScan);
  setInterval(scheduleScan, 2000);

  // 가려진 쇼츠가 자동 재생되면 바로 멈춘다
  document.addEventListener(
    'play',
    (e) => {
      const v = e.target;
      if (!(v instanceof HTMLVideoElement)) return;
      const onShorts = location.pathname.startsWith('/shorts/') && v.closest('ytd-shorts, #shorts-player');
      if (v.closest('[data-sa-reel-blocked]') || (onShorts && activeReelBlocked())) v.pause();
    },
    true
  );

  // 가려진 카드에 마우스를 올렸을 때 뜨는 미리보기 재생을 숨긴다
  document.addEventListener(
    'mouseover',
    (e) => {
      const onBlocked = !!(e.target instanceof Element && e.target.closest('[data-sa-blocked]'));
      document.documentElement.classList.toggle('sa-hover-blocked', onBlocked);
    },
    true
  );

  chrome.storage.sync.get({ enabled: true, keywords: [] }, setSettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    chrome.storage.sync.get({ enabled: true, keywords: [] }, setSettings);
  });
})();
