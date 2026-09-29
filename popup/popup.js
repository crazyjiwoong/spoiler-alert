const enabledEl = document.getElementById('enabled');
const form = document.getElementById('add-form');
const input = document.getElementById('keyword');
const list = document.getElementById('list');
const empty = document.getElementById('empty');

let keywords = [];

function render() {
  list.textContent = '';
  for (const kw of keywords) {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = kw;
    label.title = kw;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.title = '삭제';
    remove.addEventListener('click', () => save(keywords.filter((k) => k !== kw)));
    li.append(label, remove);
    list.append(li);
  }
  empty.hidden = keywords.length > 0;
}

function save(next) {
  keywords = next;
  chrome.storage.sync.set({ keywords });
  render();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const lower = keywords.map((k) => k.toLowerCase());
  const added = input.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !lower.includes(s.toLowerCase()));
  if (added.length) save([...keywords, ...new Set(added)]);
  input.value = '';
  input.focus();
});

enabledEl.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: enabledEl.checked });
  document.body.classList.toggle('off', !enabledEl.checked);
});

chrome.storage.sync.get({ enabled: true, keywords: [] }, (data) => {
  keywords = data.keywords;
  enabledEl.checked = data.enabled;
  document.body.classList.toggle('off', !data.enabled);
  render();
  input.focus();
});
