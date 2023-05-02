export default class Preferences {
  constructor(data) {
    if (data && (Object.keys(data).length == 1)) {
      this.channelId = Object.keys(data)[0];
      this.channelName = data[this.channelId].name;
      this.quality = data[this.channelId].quality;
      this.speed = data[this.channelId].speed;
    } else {
      this.channelId = null;
      this.channelName = null;
      this.reset();
    }
  }

  reset() {
    this.quality = null;
    this.speed = null;
  }

  hasChannel() {
    return (this.channelId != null);
  }

  areSet() {
    return (this.quality != null) && (this.speed != null);
  }

  toData() {
    let data = {};
    data[this.channelId] = {};
    data[this.channelId].name = this.channelName;

    if (this.quality)
      data[this.channelId].quality = this.quality;

    if (this.speed)
      data[this.channelId].speed = this.speed;

    return data;
  }
};
