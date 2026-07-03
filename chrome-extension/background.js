// Service worker for the site's two message types (externally_connectable in
// the manifest restricts senders to tabshighscore.com — no content script, no
// host permissions):
//   ping        -> silent, count-free "yes, installed" (used for detection)
//   count-tabs  -> opens a native Share/Deny window; the count is only read and
//                  returned if the user approves in browser-owned UI
// The count itself is measured in confirm.js via chrome.tabs.query (no "tabs"
// permission, so URLs/titles are stripped — only the number is ever visible).

const pending = new Map(); // request id -> the site's held sendResponse
let nextId = 0;

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message?.type === 'ping') {
    sendResponse({ installed: true });
    return; // synchronous, no channel to hold
  }
  if (message?.type !== 'count-tabs') return;

  const id = String(nextId++);
  pending.set(id, sendResponse);
  chrome.windows.create({
    url: chrome.runtime.getURL('confirm.html') + '?id=' + id,
    type: 'popup',
    width: 400,
    height: 210,
    focused: true,
  });
  return true; // hold the channel open until the user decides
});

chrome.runtime.onMessage.addListener((message) => {
  // keepalive resets the ~30s MV3 idle timer while the user reads the dialog
  if (message?.type === 'keepalive') return;
  if (message?.type !== 'verdict') return;

  const respond = pending.get(message.id);
  if (!respond) return;
  pending.delete(message.id);
  respond(message.approved ? { tabs: message.tabs } : { denied: true });
});
