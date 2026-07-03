// Runs in the extension-origin popup opened by background.js. Counts tabs
// locally, shows the number, and reports the user's verdict back to the
// service worker, which forwards it to the waiting site.

const id = new URLSearchParams(location.search).get('id');
let settled = false;

// Keep the MV3 service worker alive while the user reads the dialog: any
// message resets its ~30s idle timer, so the site's held response survives.
const keepalive = setInterval(() => chrome.runtime.sendMessage({ type: 'keepalive' }), 10000);

function verdict(approved, tabs) {
  if (settled) return;
  settled = true;
  clearInterval(keepalive);
  chrome.runtime.sendMessage({ type: 'verdict', id, approved, tabs });
}

chrome.tabs.query({}).then((tabs) => {
  const count = tabs.length;
  document.getElementById('count').textContent =
    count.toLocaleString() + ' tab' + (count === 1 ? '' : 's');
  document.getElementById('share').addEventListener('click', () => {
    verdict(true, count);
    window.close();
  });
  document.getElementById('deny').addEventListener('click', () => {
    verdict(false);
    window.close();
  });
});

// Closing the window (X, Esc) without choosing counts as a denial.
window.addEventListener('beforeunload', () => verdict(false));
