# YouTube channel preferences
A web extension to save different preferences (quality, speed) per YouTube channel.

## Build
The extension is bundled using [Parcel](https://github.com/parcel-bundler/parcel).

First, download dependencies using [npm](https://github.com/npm/cli).

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
