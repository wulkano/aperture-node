import {type RequireAtLeastOne} from 'type-fest';

export type Frame = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type Screen = {
	id: string;
	name: string;
	width: number;
	height: number;
	frame: Frame;
};

export type Window = {
	id: string;
	title?: string;
	appName?: string;
	appBundleIdentifier?: string;
	isActive: boolean;
	isOnScreen: boolean;
	layer: number;
	frame: Frame;
};

export type AudioDevice = {
	id: string;
	name: string;
};

export type ExternalDevice = {
	id: string;
	name: string;
};

export type VideoCodec = 'h264' | 'hevc' | 'proRes422' | 'proRes4444';

export type AudioRecordingOptions = {
	/**
	Audio device to include in the screen recording.

	Should be one of the `id`'s from `audioDevices()`.
	*/
	readonly audioDeviceId?: string;

	/**
	Record audio in a lossless format.
	 */
	readonly losslessAudio?: boolean;

	/**
	Record system audio.
	 */
	readonly systemAudio?: boolean;
};

export type VideoRecordingOptions<Codec extends VideoCodec> = AudioRecordingOptions & {
	/**
	Number of frames per seconds.
	*/
	readonly fps?: number;

	/**
	Show the cursor in the screen recording.
	*/
	readonly showCursor?: boolean;

	/**
	Highlight cursor clicks in the screen recording.

	Enabling this will also enable the `showCursor` option.
	*/
	readonly highlightClicks?: boolean;

	/**
	Video codec to use.

	A computer with Intel 6th generation processor or newer is strongly recommended for the `hevc` codec, as otherwise it will use software encoding, which only produces 3 FPS fullscreen recording.

	The `proRes422` and `proRes4444` codecs are uncompressed data. They will create huge files.
	*/
	readonly videoCodec?: Codec;

	/**
	The extension of the output file.

	The `proRes422` and `proRes4444` codecs only support the `mov` extension.
	*/
	readonly extension?: Codec extends 'proRes422' | 'proRes4444' ? 'mov' : ('mp4' | 'mov' | 'm4v');
};

export declare class Recorder {
	/**
	Returns a `Promise` that fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.
	*/
	startRecordingScreen: <Codec extends VideoCodec = 'h264'>(
		options: VideoRecordingOptions<Codec> & {
			/**
			The id of the screen to record.

			Should be one of the `id`'s from `screens()`.
			*/
			readonly screenId: string;

			/**
			Record only an area of the screen.
			*/
			readonly cropArea?: Frame;
		}
	) => Promise<void>;

	/**
	Returns a `Promise` that fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.
	*/
	startRecordingWindow: <Codec extends VideoCodec = 'h264'>(
		options: VideoRecordingOptions<Codec> & {
			/**
			The id of the screen to record.

			Should be one of the `id`'s from `windows()`.
			*/
			readonly windowId: string;
		}
	) => Promise<void>;

	/**
	Returns a `Promise` that fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.
	*/
	startRecordingExternalDevice: <Codec extends VideoCodec = 'h264'>(
		options: Omit<VideoRecordingOptions<Codec>, 'showCursor' | 'highlightClicks'> & {
			/**
			The id of the screen to record.

			Should be one of the `id`'s from `extranlDevices()`.
			*/
			readonly deviceId: string;
		}
	) => Promise<void>;

	/**
	Returns a `Promise` that fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.
	*/
	startRecordingAudio: (options: RequireAtLeastOne<AudioRecordingOptions, 'audioDeviceId' | 'systemAudio'>) => Promise<void>;

	/**
	`Promise` that fullfills with the path to the screen recording file when it's ready. This will never reject.

	Only available while a recording is happening, `undefined` otherwise.

	Usually, this resolves around 1 second before the recording starts, but that's not guaranteed.
	*/
	isFileReady: Promise<string> | undefined;

	/**
	Pauses the recording. To resume, call `recorder.resume()`.

	Returns a `Promise` that fullfills when the recording has been paused.
	*/
	pause: () => Promise<void>;

	/**
	Resumes the recording if it's been paused.

	Returns a `Promise` that fullfills when the recording has been resumed.
	*/
	resume: () => Promise<void>;

	/**
	Returns a `Promise` that resolves with a boolean indicating whether or not the recording is currently paused.
	*/
	isPaused: () => Promise<boolean>;

	/**
	Returns a `Promise` for the path to the screen recording file.
	*/
	stopRecording: () => Promise<string>;
}

/**
Get a list of available video codecs.

The key is the `videoCodec` option name and the value is the codec name.

It only returns `hevc` if your computer supports HEVC hardware encoding.

@example
```
Map {
	'h264' => 'H264',
	'hevc' => 'HEVC',
	'proRes422' => 'Apple ProRes 422',
	'proRes4444' => 'Apple ProRes 4444'
}
```
*/
export function videoCodecs(): Map<VideoCodec, string>;

/**
Get a list of screens.

The first screen is the primary screen.

@example
```
[{
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
}]
```
*/
export function screens(): Promise<Screen[]>;

export type WindowOptions = {
	/**
	Exclude desktop windows like Finder, Dock, and Desktop.

	@default true
	*/
	readonly excludeDesktopWindows?: boolean;

	/**
	Only include windows that are on screen.

	@default true
	*/
	readonly onScreenOnly?: boolean;
};

/**
Get a list of windows.

@example
```
[{
	id: '69732482',
	title: 'Unicorn',
	appName: 'Safari',
	appBundleIdentifier: 'com.apple.Safari',
	isActive: true,
	isOnScreen: true,
	layer: 0,
	frame: {
		x: 0,
		y: 0,
		width: 1280,
		height: 800
	}
}]
```
*/
export function windows(options?: WindowOptions): Promise<Window[]>;

/**
Get a list of audio devices.

@example
```
[{
	id: 'AppleHDAEngineInput:1B,0,1,0:1',
	name: 'Built-in Microphone'
}]
```
*/
export function audioDevices(): Promise<AudioDevice[]>;

/**
Get a list of external devices.

@example
```
[{
	id: '9eb08da55a14244bf8044bf0f75247d2cb9c364c',
	name: 'iPad Pro'
}]
```
*/
export function externalDevices(): Promise<ExternalDevice[]>;

export const recorder: Recorder;
