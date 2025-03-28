let sessionActive = false;
let allowedUrls = [];
let gracePeriod = 5 * 60 * 1000;
let warningThreshold = 30 * 1000;
let timerId = null;
let timerStart = null;
let sessionEndTime = null;

function isAllowedUrl(url) {
  return allowedUrls.some(allowed => url.includes(allowed));
}

function startDistractionTimer() {
  if (timerId !== null) return;
  timerStart = Date.now();

  timerId = setTimeout(() => {
    enforceFocusLock();
    clearDistractionTimer();
  }, gracePeriod);

  setTimeout(() => {
    if (timerId !== null) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock Warning",
        message: "You're off track. Return to an allowed site or you'll be redirected soon."
      });
    }
  }, warningThreshold);
}

function clearDistractionTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function enforceFocusLock() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      if (!isAllowedUrl(tab.url)) {
        chrome.tabs.remove(tab.id);
      }
    });
    if (allowedUrls.length > 0) {
      chrome.tabs.create({ url: allowedUrls[0] });
    }
  });
}

function checkActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) return;
    let activeTab = tabs[0];
    if (isAllowedUrl(activeTab.url)) {
      clearDistractionTimer();
    } else {
      startDistractionTimer();
    }
  });
}

chrome.tabs.onActivated.addListener(() => {
  if (!sessionActive) return;
  checkActiveTab();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!sessionActive) return;
  if (tab.active && changeInfo.url) {
    checkActiveTab();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "startSession") {
    sessionActive = true;
    allowedUrls = request.allowedUrls;
    gracePeriod = request.gracePeriod;
    sessionEndTime = request.sessionDuration ? Date.now() + request.sessionDuration : null;
    checkActiveTab();
    sendResponse({ status: "Session started" });
  } else if (request.type === "endSession") {
    sessionActive = false;
    clearDistractionTimer();
    sendResponse({ status: "Session ended" });
  }
});

setInterval(() => {
  if (sessionActive && sessionEndTime && Date.now() > sessionEndTime) {
    sessionActive = false;
    clearDistractionTimer();
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "FocusLock Session Ended",
      message: "Your focus session has expired."
    });
  }
}, 1000);
