// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// /////////////////////////////////

// Group tabs by creating a tab group with all tabs that match the URL pattern
// Pattern should be based on domain

const tabs = await chrome.tabs.query({
  windowId: chrome.windows.WINDOW_ID_CURRENT
})
const groups = createGroups(tabs);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const template = document.getElementById('li_template');
const elements = new Set();
for (const tab of tabs) {
  const element = template.content.firstElementChild.cloneNode(true);

  const title = tab.title.split('-')[0].trim();
  const pathname = new URL(tab.url).pathname.slice('/docs'.length);

  element.querySelector('.title').textContent = title;
  element.querySelector('.pathname').textContent = pathname;
  element.querySelector('a').addEventListener('click', async () => {
    // need to focus window as well as the active tab
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });

  elements.add(element);
}
document.querySelector('ul').append(...elements);

const button = document.querySelector('button');
button.addEventListener('click', async () => {
  for (const pair of groups.entries()) {
    const [hostname, tabs] = pair;
    if (!tabs.length) continue

    const tabIds = tabs.map(tab => tab.id);
    const group = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(group, { title: hostname });
  }
});

function createGroups(tabs) {
  const groups = new Map();

  tabs.forEach(tab => {
    const { hostname } = new URL(tab.url);
    const group = groups.get(hostname) || [];
    group.push(tab);
    groups.set(hostname, group);
  });

  return groups
}
