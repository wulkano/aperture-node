# aperture-node [![Build Status](https://travis-ci.org/wulkano/aperture-node.svg?branch=master)](https://travis-ci.org/wulkano/aperture-node)

> Record the screen on macOS from Node.js


## Install

```
$ npm install aperture
```

*Requires macOS 10.12 or later.*


## Usage

```js
const delay = require('delay');
const aperture = require('aperture')();

const options = {
  fps: 30,
  cropArea: {
    x: 100,
    y: 100,
    width: 500,
    height: 500
  }
};

(async () => {
  await aperture.startRecording(options);
  await delay(3000);
  console.log(await aperture.stopRecording());
  //=> '/private/var/folders/3x/jf5977fn79jbglr7rk0tq4d00000gn/T/cdf4f7df426c97880f8c10a1600879f7.mp4'
})();
```

See [`example.js`](example.js) if you want to quickly try it out. *(The example requires Node.js 8+)*


## API

#### aperture.screens() -> `Promise<Object[]>`

Get a list of screens. The first screen is the primary screen.

Example:

```js
[{
  id: 69732482,
  name: 'Color LCD'
}]
```

#### aperture.audioDevices() -> `Promise<Object[]>`

Get a list of audio devices.

Example:

```js
[{
  id: 'AppleHDAEngineInput:1B,0,1,0:1',
  name: 'Built-in Microphone'
}]
```

#### aperture.videoCodecs -> `Map`

Get a list of available video codecs. The key is the `videoCodec` option name and the value is the codec name. It only returns `hevc` if you're on macOS 10.13 or newer and your computer supports HEVC hardware encoding.

Example:

```js
Map {
  'h264' => 'H264',
  'hevc' => 'HEVC',
  'proRes422' => 'Apple ProRes 422',
  'proRes4444' => 'Apple ProRes 4444'
}
```

#### recorder = `aperture()`

#### recorder.startRecording([[options]](#options))

Returns a `Promise` for the path to the screen recording file.

Fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.

#### recorder.stopRecording()

Returns a `Promise` for the path to the screen recording file.

## Options

#### fps

Type: `number`<br>
Default: `30`

Number of frames per seconds.

#### cropArea

Type: `Object`<br>
Default: `undefined`

Record only an area of the screen. Accepts an object with `x`, `y`, `width`, `height` properties.

#### showCursor

Type: `boolean`<br>
Default: `true`

Show the cursor in the screen recording.

#### highlightClicks

Type: `boolean`<br>
Default: `false`

Highlight cursor clicks in the screen recording.

Enabling this will also enable the `showCursor` option.

#### screenId

Type: `number`<br>
Default: `aperture.screens()[0]` *(Primary screen)*

Screen to record.

#### audioDeviceId

Type: `string`<br>
Default: `undefined`

Audio device to include in the screen recording. Should be one of the `id`'s from `aperture.audioDevices()`.

#### videoCodec

Type: `string`<br>
Default: `h264`<br>
Values: `hevc` `h264` `proRes422` `proRes4444`

The `hevc` codec requires macOS 10.13 or newer. A computer with Intel 6th generation processor or newer is strongly recommended, as otherwise it will use software encoding, which only produces 3 FPS fullscreen recording.

The [`proRes422` and `proRes4444`](https://documentation.apple.com/en/finalcutpro/professionalformatsandworkflows/index.html#chapter=10%26section=2%26tasks=true) codecs are uncompressed data. They will create huge files.


## Why

Aperture was built to fulfill the needs of [Kap](https://github.com/wulkano/kap), providing a JavaScript interface to the **best** available method for recording the screen. That's why it's currently a wrapper for a [Swift script](Sources/ApertureCLI/main.swift) that records the screen using the [AVFoundation framework](https://developer.apple.com/av-foundation/).

#### But you can use `ffmpeg -f avfoundation...`

Yes, we can, but the performance is terrible:

##### Recording the entire screen with `ffmpeg -f avfoundation -i 1 -y test.mp4`:

![ffmpeg](https://cloud.githubusercontent.com/assets/4721750/19214740/f823d4b6-8d60-11e6-8af3-4726146ef29a.jpg)

##### Recording the entire screen with Aperture:

![aperture](https://cloud.githubusercontent.com/assets/4721750/19214743/11f4aaaa-8d61-11e6-9822-4e83bcdfab24.jpg)


## Related

- [Aperture](https://github.com/wulkano/Aperture) - The Swift framework used in this package


## License

MIT
