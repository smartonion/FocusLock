document.addEventListener('DOMContentLoaded', function () {
  const startBtn = document.getElementById('startBtn');
  const endBtn = document.getElementById('endBtn');

  startBtn.addEventListener('click', function () {
    const allowedUrlsInput = document.getElementById('allowedUrls').value;
    const gracePeriodInput = parseFloat(document.getElementById('gracePeriod').value);
    const sessionDurationInput = parseFloat(document.getElementById('sessionDuration').value);

    const allowedUrls = allowedUrlsInput
      .split(',')
      .map(url => url.trim())
      .filter(url => url);

    const gracePeriod = gracePeriodInput * 60 * 1000;
    const sessionDuration = sessionDurationInput ? sessionDurationInput * 60 * 1000 : null;

    chrome.runtime.sendMessage(
      { type: "startSession", allowedUrls, gracePeriod, sessionDuration },
      function (response) {
        console.log(response.status);
        startBtn.style.display = "none";
        endBtn.style.display = "block";
      }
    );
  });

  endBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: "endSession" }, function (response) {
      console.log(response.status);
      startBtn.style.display = "block";
      endBtn.style.display = "none";
    });
  });
});
