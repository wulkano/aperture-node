# aperture-node

> Record the screen on macOS from Node.js

## Install

```sh
npm install aperture
```

*Requires macOS 13 or later.*

## Usage

```js
import {setTimeout} from 'node:timers/promises';
import {recorder, screens} from 'aperture';

const allScreens = await screens();

const options = {
	screenId: allScreens[0].id,
	fps: 30,
	cropArea: {
		x: 100,
		y: 100,
		width: 500,
		height: 500,
	},
};

await recorder.startRecordingScreen(options);

await setTimeout(3000);

console.log(await recorder.stopRecording());
//=> '/private/var/folders/3x/jf5977fn79jbglr7rk0tq4d00000gn/T/cdf4f7df426c97880f8c10a1600879f7.mp4'
```

See [`example.js`](example.js) if you want to quickly try it out. _(The example requires Node.js 18+)_

## API

#### screens() -> `Promise<Screen[]>`

Get a list of screens. The first screen is the primary screen.

Example:

```js
[
	{
		id: '69732482',
		name: 'Color LCD',
		width: 1280,
		height: 800,
		frame: {
			x: 0,
			y: 0,
			width: 1280,
			height: 800
		}
	},
];
```

#### windows(options: WindowOptions) -> `Promise<Window[]>`

Get a list of windows

##### WindowOptions.excludeDesktopWindows

Type: `Boolean`\
Default: `true`

Exclude desktop windows like Finder, Dock, and Desktop.

##### WindowOptions.onScreenOnly

Type: `Boolean`\
Default: `true`

Only include windows that are on screen.


Example:

```js
[
	{
		id: '69732482',
		title: 'Unicorn',
		applicationName: 'Safari',
		applicationBundleIdentifier: 'com.apple.Safari',
		isActive: true,
		isOnScreen: true,
		layer: 0,
		frame: {
			x: 0,
			y: 0,
			width: 1280,
			height: 800
		}
	}
];
```

#### audioDevices() -> `Promise<AudioDevice[]>`

Get a list of audio devices.

Example:

```js
[
	{
		id: 'AppleHDAEngineInput:1B,0,1,0:1',
		name: 'Built-in Microphone',
	},
];
```

#### externalDevices() -> `Promise<ExternalDevice[]>`

Get a list of external devices.

Example:

```js
[
	{
		id: '9eb08da55a14244bf8044bf0f75247d2cb9c364c',
		name: 'iPad Pro'
	},
];
```

#### videoCodecs -> `Map`

Get a list of available video codecs. The key is the `videoCodec` option name and the value is the codec name. It only returns `hevc` if your computer supports HEVC hardware encoding.

Example:

```js
Map {
	'h264' => 'H264',
	'hevc' => 'HEVC',
	'proRes422' => 'Apple ProRes 422',
	'proRes4444' => 'Apple ProRes 4444'
}
```

#### Audio Recording Options

##### audioDeviceId

Type: `string`\
Default: `undefined`

Audio device to include in the screen recording. Should be one of the `id`'s from `aperture.audioDevices()`.

##### losslessAudio

Type: `boolean`\
Default: `false`

Record audio in a lossless format (ALAC). Uses lossy (AAC) otherwise.

##### systemAudio

Type: `boolean`\
Default: `false`

Record system audio.

#### Video Recording Options

##### fps

Type: `number`\
Default: `30`

Number of frames per seconds.

##### showCursor

Type: `boolean`\
Default: `true`

Show the cursor in the screen recording.

##### highlightClicks

Type: `boolean`\
Default: `false`

Highlight cursor clicks in the screen recording.

Enabling this will also enable the `showCursor` option.

##### videoCodec

Type: `string`\
Default: `'h264'`\
Values: `'hevc' | 'h264' | 'proRes422' | 'proRes4444'`

A computer with Intel 6th generation processor or newer is strongly recommended for the `hevc` codec, as otherwise it will use software encoding, which only produces 3 FPS fullscreen recording.

The [`proRes422` and `proRes4444`](https://documentation.apple.com/en/finalcutpro/professionalformatsandworkflows/index.html#chapter=10%26section=2%26tasks=true) codecs are uncompressed data. They will create huge files.

##### extension

Type: `string`\
Default:

- `'m4a'` for [audio](#recorderstartrecordingaudiooptions) recordings
- `'mov'` for `proRes422` and `proRes4444` video codecs
- `'mp4'` otherwise

Values:

- `'m4a'` is the only valid option for [audio](#recorderstartrecordingaudiooptions) recordings
- `'mov'` is the only valid option for `proRes422` and `proRes4444` video codecs
- `'mp4' | 'm4v' | 'mov'` for all other video codecs

The extension of the output file

#### recorder

#### recorder.startRecordingScreen(options)

Returns a `Promise` that fullfills when the recording starts.

Accepts all [video](#video-recording-options) and [audio](#audio-recording-options) options, along with

##### screenId

Type: `string`

The identifier of the screen to record.

Should be one of the `id`'s from `screens()`.

##### cropArea

Type: `object`\
Default: `undefined`

Record only an area of the screen. Accepts an object with `x`, `y`, `width`, `height` properties.

#### recorder.startRecordingWindow(options)

Returns a `Promise` that fullfills when the recording starts.

Accepts all [video](#video-recording-options) and [audio](#audio-recording-options) options, along with

##### windowId

Type: `string`

The id of the screen to record.

Should be one of the `id`'s from `windows()`.

#### recorder.startRecordingExternalDevice(options)

Returns a `Promise` that fullfills when the recording starts.

Accepts all [video](#video-recording-options) and [audio](#audio-recording-options) options, along with

##### deviceId

Type: `string`

The id of the screen to record.

Should be one of the `id`'s from `externalDevices()`.

#### recorder.startRecordingAudio(options)

Returns a `Promise` that fullfills when the recording starts.

Accepts all [audio](#audio-recording-options) options

#### recorder.isFileReady

`Promise` that fullfills with the path to the screen recording file when it's ready. This will never reject.

Only available while a recording is happening, `undefined` otherwise.

Usually, this resolves around 1 second before the recording starts, but that's not guaranteed.

#### recorder.pause()

Pauses the recording. To resume, call `recorder.resume()`.

Returns a `Promise` that fullfills when the recording has been paused.

#### recorder.resume()

Resumes the recording if it's been paused.

Returns a `Promise` that fullfills when the recording has been resumed.

#### recorder.isPaused()

Returns a `Promise` that resolves with a boolean indicating whether or not the recording is currently paused.

#### recorder.stopRecording()

Returns a `Promise` for the path to the screen recording file.

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
