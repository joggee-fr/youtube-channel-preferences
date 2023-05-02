import Preferences from '../preferences.js';

let currentTab;

function showChannelPreferences(hasChannelDiv, preferences) {
  hasChannelDiv.querySelector("div#channel_name").innerHTML = preferences.channelName;
  hasChannelDiv.querySelector("div#channel_id").innerHTML = `(${preferences.channelId})`;

  hasChannelDiv.querySelector("div#channel_status").innerHTML =
    preferences.areSet() ? "" : "No preferences saved";

  // Quality
  const qualitySelect = hasChannelDiv.querySelector("select#quality");
  const quality = preferences.quality ?? "auto";
  qualitySelect.value = quality;

  // Speed
  const speedSelect = hasChannelDiv.querySelector("select#speed");
  const speed = preferences.speed ?? 1;
  speedSelect.value = speed;

  const form = hasChannelDiv.querySelector("form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    preferences.quality = qualitySelect.value;
    preferences.speed = parseFloat(speedSelect.value);
    browser.tabs.sendMessage(currentTab.id, { cmd: "savePreferences", data: preferences.toData() });
  });

  form.addEventListener("reset", async (e) => {
    e.preventDefault();
    qualitySelect.value = "auto";
    speedSelect.value = 1;
    preferences.reset();
    browser.tabs.sendMessage(currentTab.id, { cmd: "removePreferences", data: preferences.toData() });
  });
}

function showPreferences(preferences) {
  const noChannelDiv = document.querySelector("div#no_channel");
  const hasChannelDiv = document.querySelector("div#has_channel");

  if (preferences.hasChannel()) {
    noChannelDiv.style.display = "none";
    hasChannelDiv.style.display = "block";
    showChannelPreferences(hasChannelDiv, preferences);
  } else {
    noChannelDiv.style.display = "block";
    hasChannelDiv.style.display = "none";
  }
}

async function init() {
  // Retrieve the active tab
  const tabs = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (tabs.length > 0) {
    // Retrieve current preferences
    currentTab = tabs[0];
    const data = await browser.tabs.sendMessage(currentTab.id, { cmd: "getCurrentPreferences" });
    const preferences = new Preferences(data);
    showPreferences(preferences);
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
