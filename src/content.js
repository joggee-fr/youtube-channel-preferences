import browser from "webextension-polyfill";
import logger from "console-log-level";

import Preferences from './preferences.js';

let log = logger({ level: "trace" });

let currentPreferences = null;

function setQuality(player, quality) {
  log.info(`Set quality: ${quality}`);

  if (!quality || (quality === "auto")) {
    player.setPlaybackQualityRange("auto", "auto");
    return;
  }

  let labels = player.getAvailableQualityLabels();

  // parseInt() do the trick not taking care of traling "p"
  let qualityInt = parseInt(quality);
  let selectedIndex = '';

  // Quality levels are ordered from higher to lower
  for (selectedIndex = 0; selectedIndex < labels.length; selectedIndex++) {
    let availableQualityInt = parseInt(labels[selectedIndex]);
    if (availableQualityInt == qualityInt) {
      break;
    }

    if (availableQualityInt < qualityInt) {
      // We may choose higher (i.e. possibily (i -1) value) or lower quality here
      // as the perfect match is not available
      break;
    }

    // Higher than expected quality, continue
  }

  // Unexpected case
  if (selectedIndex.length == labels.length)
    selectedIndex = labels.length - 1;

  // Retrieve corresponding level
  const level = player.getAvailableQualityLevels()[selectedIndex];
  player.setPlaybackQualityRange(level, level);
}

function setSpeed(player, speed) {
  log.info(`Set speed: ${speed}`);

  if (!speed) {
    player.setPlaybackRate(1);
    return;
  }

  player.setPlaybackRate(speed);
}

function setChannelPreferences(notifyBackground) {
  log.trace("Set channel preferences");

  if (notifyBackground) {
    browser.runtime.sendMessage({cmd: "updateCurrentPreferences", data: currentPreferences.toData() })
      .catch(e => { /* Ignore */ });
  }

  // Get wrappedJSObject to access YouTube API set on player element
  const player = document.querySelector("#movie_player").wrappedJSObject;
  setQuality(player, currentPreferences.quality);
  setSpeed(player,currentPreferences.speed);
}

async function handleChannel(a) {
  log.debug(a);

  const channelId = a.getAttribute("href").slice(1);
  const channelName = a.text;

  const savedData = await browser.storage.local.get(channelId);
  let savedPreferences = new Preferences(savedData);
  log.debug("Saved preferences: %j", savedData);

  // Check if some preferences have been already saved
  if (!savedPreferences.hasChannel()) {
    log.info(`No preferences already saved for channel ${channelId}`);
    currentPreferences = new Preferences();
    currentPreferences.channelId = channelId;
    currentPreferences.channelName = channelName;
    setChannelPreferences(true);
    return;
  }

  // The channel name may have changed
  if (savedPreferences.channelName != channelName) {
    savedPreferences.channelName = channelName;
    // Do not wait for result, keep save asynchronous
    browser.storage.local.set(savedPreferences.toData());
  }

  currentPreferences = savedPreferences;
  setChannelPreferences(true);
}

function observeChannelLink(a) {
  if (a.hasAttribute("href")) {
    handleChannel(a);
  }

  // Observe href attribute to follow changes
  // Never disconnect!
  let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "href")
        handleChannel(a);
    }
  });

  observer.observe(a, { attributes: true });
}

function observeChannelDiv(channelDiv) {
  const linkSelector = "a.yt-formatted-string";

  log.debug(channelDiv);

  // Retrieve the link containing the channel name
  let a = channelDiv.querySelector(linkSelector);
  if (a) {
    log.debug("Found channel link without observing");
    observeChannelLink(a);
    return;
  }

  log.debug("Wait for channel link");
  let observer = new MutationObserver(() => {
    a = channelDiv.querySelector(linkSelector);
    if (a) {
      observeChannelLink(a);
      observer.disconnect();
    }
  });

  observer.observe(channelDiv, { childList: true, subtree: true });
}

function retrieveChannel() {
  const channelDivSelector = "div#owner";

  // Check if channel div already exist
  const channelDiv = document.querySelector(channelDivSelector);
  if (channelDiv) {
    log.debug("Found channel div without observing");
    observeChannelDiv(channelDiv);
    return;
  }

  log.debug("Wait for channel div");

  let observer = new MutationObserver(() => {
    const channelDiv = document.querySelector(channelDivSelector);
    if (channelDiv) {
      log.debug("Found channel div");
      observeChannelDiv(channelDiv);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Handle messages
browser.runtime.onMessage.addListener(request => {
  log.trace("Received message from background script");

  if (request.cmd === "getCurrentPreferences") {
    return Promise.resolve(currentPreferences ? currentPreferences.toData() : null);
  } else if (request.cmd === "savePreferences") {
    log.debug("Received savePreferences command with data: %j", request.data);
    currentPreferences = new Preferences(request.data);
    setChannelPreferences();
    return browser.storage.local.set(request.data);
  } else if (request.cmd === "removePreferences") {
    currentPreferences = new Preferences(request.data);
    setChannelPreferences();
    return browser.storage.local.remove(currentPreferences.channelId);
  }

  return Promise.resolve({});
});

// Init
log.info("Initializing YouTube channel preferences extension");
retrieveChannel();
