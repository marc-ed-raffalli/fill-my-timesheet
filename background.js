(function () {
  'use strict';

  const supportedSites = [
    {name: 'purelyhr', rule: /https:\/\/.+\.purelyhr.com/}
  ];

  function onUpdate(tabId, changeInfo, tab) {
    if (!tab || !tab.url || changeInfo.status !== 'complete') {
      return;
    }

    const siteSupported = supportedSites.find(d => tab.url.match(d.rule) !== null);

    if (siteSupported) {
      console.log('Matched site', siteSupported.name);
      chrome.pageAction.show(tabId);
    }
  }

  chrome.tabs.onUpdated.addListener(onUpdate);

})();
