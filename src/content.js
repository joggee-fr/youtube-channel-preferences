import browser from "webextension-polyfill";
import logger from "console-log-level";

import Preferences from './preferences.js';

let log = logger({ prefix: "youtube-channel-preferences", level: "trace" });

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

async function handleChannel(channel) {
  log.debug(`Channel: ${channel.id} ${channel.name}`);

  const savedData = await browser.storage.local.get(channel.id);
  log.debug("Saved preferences: %j", savedData);
  let savedPreferences = new Preferences(savedData);

  // Check if some preferences have been already saved
  if (!savedPreferences.hasChannel()) {
    log.info(`No preferences already saved for channel ${channel.id}`);
    currentPreferences = new Preferences();
    currentPreferences.channelId = channel.id;
    currentPreferences.channelName = channel.name;
    setChannelPreferences(true);
    return;
  }

  // The channel name may have changed
  if (savedPreferences.channelName != channel.name) {
    savedPreferences.channelName = channel.name;
    // Do not wait for result, keep save asynchronous
    browser.storage.local.set(savedPreferences.toData());
  }

  currentPreferences = savedPreferences;
  setChannelPreferences(true);
}

async function handleChannelId(channel, channelDiv, a) {
  channel.id = a.getAttribute("href").slice(1);
  log.debug(`Channel id: ${channel.id}`);
  observeNode(channelDiv, "a.yt-formatted-string", "channel name link", a => handleChannelName(channel, a));
}

function observeChannelId(channel, channelDiv, a) {
  if (a.hasAttribute("href")) {
    handleChannelId(channel, channelDiv, a);
  }

  // Observe href attribute to follow changes
  // Never disconnect!
  let observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === "href")
        handleChannelId(channel, channelDiv, a);
    }
  });

  observer.observe(a, { attributes: true });
}

function handleChannelName(channel, a) {
  channel.name = a.text;
  log.debug(`Channel name: ${channel.name}`);
  handleChannel(channel);
}

function observeNode(parent, selector, name, cb) {
  let s = parent.querySelector(selector);
  if (s) {
    log.debug(`Found ${name} without observing`);
    cb(s);
    return;
  }

  log.debug(`Wait for ${name}`);
  let observer = new MutationObserver(() => {
    s = parent.querySelector(selector);
    if (s) {
      log.debug(`Found ${name}`);
      observer.disconnect();
      cb(s);
    }
  });

  observer.observe(parent, { childList: true, subtree: true });
}

function observeChannelDiv(channel, channelDiv) {
  observeNode(channelDiv, "a.ytd-video-owner-renderer", "channel id link", a => observeChannelId(channel, channelDiv, a));
}

function retrieveChannel() {
  let channel = {};
  observeNode(document, "div#owner", "channel div", div => observeChannelDiv(channel, div));
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
