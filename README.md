# YouTube channel preferences web extension
This web extension allows to define and apply different preferences (quality, speed) per YouTube channel.

## Usage
- Open a YouTube video from your favorite channel
- Open the extension popup to save or remove dedicated preferences
- The preferences will now be applied to every videos of the same channel

## Installation
- [Firefox add-ons](https://addons.mozilla.org/firefox/addon/youtube-channel-preferences/)

## Build
The extension is bundled using [Parcel](https://github.com/parcel-bundler/parcel).

Once this repository has been cloned, download the dependencies using [npm](https://github.com/npm/cli).

```
$ npm install
```

Then, `watch` or `build` scripts can be used for development or release.

`watch` will build the extension in the `dist` directory and automatically rebuild it once a file change is detected.

```
$ npm run watch
```

[web-ext](https://github.com/mozilla/web-ext) from Mozilla may now be used to test the development.

```
$ cd dist
$ web-ext -u https://youtube.com
```
