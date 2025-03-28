let sessionActive = false;
let allowedUrls = [];
let gracePeriod = 5 * 60 * 1000;
let warningThreshold = 30 * 1000;
let timerId = null;
let timerStart = null;
let sessionEndTime = null;
let wasOnAllowed = true;
let notified5Minutes = false; 
let notified1Minute = false;

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

  // NEW: Countdown notifications every 5 seconds when 30 seconds are left
  let countdownIntervalId = setInterval(() => {
    let timeElapsed = Date.now() - timerStart;
    let timeLeft = gracePeriod - timeElapsed;
    if (timeLeft <= 30000 && timeLeft > 0) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock Countdown",
        message: "Time left until enforcement: " + Math.ceil(timeLeft / 1000) + " seconds"
      });
    }
    if (timeLeft <= 0) {
      clearInterval(countdownIntervalId);
    }
  }, 5000);
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
    let currentlyAllowed = isAllowedUrl(activeTab.url);
    if (currentlyAllowed && !wasOnAllowed) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock",
        message: "You are back on an allowed website."
      });
    } else if (!currentlyAllowed && wasOnAllowed) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock",
        message: "You have left the allowed website."
      });
    }
    wasOnAllowed = currentlyAllowed;
    if (currentlyAllowed) {
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
    wasOnAllowed = true;
    notified5Minutes = false; 
    notified1Minute = false; 
    checkActiveTab();
    // NEW: Notification for session start with chosen settings
    let graceMinutes = gracePeriod / 60000;
    let sessionMinutes = request.sessionDuration ? request.sessionDuration / 60000 : "Unlimited";
    let allowedSites = allowedUrls.join(", ");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "FocusLock Session Started",
      message: "Settings:\nGrace Period: " + graceMinutes + " minutes\nSession Duration: " + sessionMinutes + " minutes\nAllowed Websites: " + allowedSites
    });
    sendResponse({ status: "Session started" });
  } else if (request.type === "endSession") {
    sessionActive = false;
    clearDistractionTimer();
    // NEW: Notification for session end
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "FocusLock Session Ended",
      message: "Your focus session has ended."
    });
    sendResponse({ status: "Session ended" });
  }
});

setInterval(() => {
  if (sessionActive && sessionEndTime) {
    let timeToSessionEnd = sessionEndTime - Date.now();
    // NEW: Notification when 5 minutes left in session
    if (!notified5Minutes && timeToSessionEnd <= 5 * 60 * 1000) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock Session",
        message: "Only 5 minutes left in your session."
      });
      notified5Minutes = true;
    }
    // NEW: Notification when 1 minute left in session
    if (!notified1Minute && timeToSessionEnd <= 1 * 60 * 1000) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "FocusLock Session",
        message: "Only 1 minute left in your session."
      });
      notified1Minute = true;
    }
  }
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
