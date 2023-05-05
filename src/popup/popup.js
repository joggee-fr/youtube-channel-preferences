import Preferences from '../preferences.js';

function showDiv(element) {
  element.style.display = "block";
}

function showChannelStatus(statusDiv, preferencesSet) {
  statusDiv.innerHTML = preferencesSet ? "" : "No preferences saved";
}

function showChannelPreferences(currentTab, successDiv, preferences) {
  successDiv.querySelector("div#channel_name").innerHTML = preferences.channelName;
  successDiv.querySelector("div#channel_id").innerHTML = `(${preferences.channelId})`;

  const statusDiv = successDiv.querySelector("div#channel_status");
  showChannelStatus(statusDiv, preferences.areSet());

  // Quality
  const qualitySelect = successDiv.querySelector("select#quality");
  const quality = preferences.quality ?? "auto";
  qualitySelect.value = quality;

  // Speed
  const speedSelect = successDiv.querySelector("select#speed");
  const speed = preferences.speed ?? 1;
  speedSelect.value = speed;

  const form = successDiv.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    preferences.quality = qualitySelect.value;
    preferences.speed = parseFloat(speedSelect.value);
    await browser.tabs.sendMessage(currentTab.id, { cmd: "savePreferences", data: preferences.toData() });
    showChannelStatus(statusDiv, true);
  });

  form.addEventListener("reset", async (e) => {
    e.preventDefault();
    qualitySelect.value = "auto";
    speedSelect.value = 1;
    preferences.reset();
    await browser.tabs.sendMessage(currentTab.id, { cmd: "removePreferences", data: preferences.toData() });
    showChannelStatus(statusDiv, false);
  });
}

function showPreferences(currentTab, preferences) {
  if (preferences && preferences.hasChannel()) {
    const successDiv = document.querySelector("div#success");
    showDiv(successDiv);
    showChannelPreferences(currentTab, successDiv, preferences);
  } else {
    const errorDiv = document.querySelector("div#error");
    showDiv(errorDiv);
    errorDiv.innerHTML = "No channel detected";
  }
}

function showNoTab() {
  const errorDiv = document.querySelector("div#error");
  showDiv(errorDiv);
  errorDiv.innerHTML = "Invalid current tab";
}

async function init() {
  // Retrieve the active tab
  try {
    const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs.length > 0) {
      // Retrieve current preferences
      let currentTab = tabs[0];
      const data = await browser.tabs.sendMessage(currentTab.id, { cmd: "getCurrentPreferences" });
      const preferences = new Preferences(data);
      showPreferences(currentTab, preferences);
    } else {
      showNoTab();
    }
  } catch(e) {
    showNoTab();
  }


  // Listen for messages
  browser.runtime.onMessage.addListener(request => {
    if (request.cmd === "updateCurrentPreferences") {
      const preferences = new Preferences(request.data);
      showPreferences(preferences);
      return Promise.resolve({});
    }
  });
}

init().catch(e => console.error(e));
