// Answers count requests sent straight from the site: externally_connectable
// in the manifest restricts senders to tabshighscore.com pages, so no content
// script and no host permissions are needed. With no "tabs" permission,
// chrome.tabs.query returns every tab stripped of URL/title — we can count
// them but never see what anyone is browsing.
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'count-tabs') return;
  chrome.tabs.query({}).then((tabs) => sendResponse({ tabs: tabs.length }));
  return true; // keep the message channel open for the async response
});
