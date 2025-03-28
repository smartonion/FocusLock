document.addEventListener('DOMContentLoaded', function () {
  const startBtn = document.getElementById('startBtn');
  const endBtn = document.getElementById('endBtn');
  const allowedUrlsInput = document.getElementById('allowedUrls');
  // Check if a session is already active when the popup opens
  chrome.storage.local.get(['sessionActive', 'allowedUrlsRaw'], function (result) {
    if (result.sessionActive) {
      startBtn.style.display = "none";
      endBtn.style.display = "block";
    } else {
      startBtn.style.display = "block";
      endBtn.style.display = "none";
    }

    if (result.allowedUrlsRaw) {
      allowedUrlsInput.value = result.allowedUrlsRaw;
    }
  });

  startBtn.addEventListener('click', function () {
    const rawUrls = allowedUrlsInput.value;
    const gracePeriodInput = parseFloat(document.getElementById('gracePeriod').value);
    const sessionDurationInput = parseFloat(document.getElementById('sessionDuration').value);

    const allowedUrls = rawUrls
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const gracePeriod = gracePeriodInput * 60 * 1000;
    const sessionDuration = sessionDurationInput ? sessionDurationInput * 60 * 1000 : null;

    chrome.runtime.sendMessage(
      { type: "startSession", allowedUrls, gracePeriod, sessionDuration },
      function (response) {
        chrome.storage.local.set({
          sessionActive: true,
          allowedUrlsRaw: rawUrls
        });
        console.log(response.status);
        startBtn.style.display = "none";
        endBtn.style.display = "block";
      }
    );
  });

  endBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: "endSession" }, function (response) {
      chrome.storage.local.set({ sessionActive: false });
      console.log(response.status);
      startBtn.style.display = "block";
      endBtn.style.display = "none";
    });
  });
});
