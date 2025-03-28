# FocusLock

A simple Chrome extension to keep you focused on specified websites. If you wander off the allowed sites for too long, it automatically closes distracting tabs and redirects you back.

## Features

- **Configurable Whitelist**  
  Specify one or more URLs where you want to remain focused.

- **Grace Period**  
  Set a time limit (in minutes) for how long you can be off-task.

- **Automatic Redirect**  
  If you exceed the grace period, any distracting tabs close and a new tab opens for an allowed site.

- **Session Duration**  
  Optionally set an overall session length. The extension will automatically end once time is up.

- **Soft Warning**  
  A brief notification warns you when you first stray from your focus sites.

## File Structure

- **manifest.json**  
  Declares extension permissions, background scripts, and popup configuration.

- **background.js**  
  Monitors tab activity, triggers warnings, closes distracting tabs, and redirects to a whitelisted site.

- **popup.html**  
  A simple UI to input whitelisted URLs, set grace period, and configure session length.

- **popup.js**  
  Manages user interactions in the popup and communicates with the background script.

## Installation

1. Clone or download this repository.
2. Visit `chrome://extensions` in your Chrome browser.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **"Load unpacked"** and select the folder containing these files.

## Usage Instructions

1. Click on the **FocusLock** icon in the toolbar.
2. Enter one or more allowed URLs, separated by commas. For example:
   ```
   https://example.com, https://work.com
   ```
3. Set the **Grace Period** in minutes (the time you can stay off-task before being redirected).
4. Optionally set a **Session Duration** in minutes. Leave blank if you want the session to run indefinitely.
5. Click **Start Session** to begin.
6. Once started, any time spent on non-whitelisted sites counts toward your grace period. If you remain on them past that threshold, those tabs close automatically and you’ll be taken back to an allowed site.
7. Use **End Session** to stop monitoring before the session duration ends.

## How It Works

- The extension checks your currently active tab.  
- If the tab’s URL doesn’t match your whitelist, a timer starts counting down.  
- If you switch back to a whitelisted site before time runs out, the timer resets.  
- If you remain off the whitelisted sites for longer than the grace period, the background script closes those distracting tabs and opens a new tab on one of your allowed URLs.

## Notes

- Requires the following Chrome permissions:
  - **tabs** and **activeTab** for monitoring and closing tabs.
  - **storage** to remember user preferences.
  - **notifications** to display soft warnings.
- The code uses `chrome.runtime.sendMessage` to communicate between the popup and the background script.

THis extension has not been extensively tested. Bugs may appear! Any that are found during future development will be fixed.

Feel free to modify or expand the features as needed. Pull requests are welcome!
