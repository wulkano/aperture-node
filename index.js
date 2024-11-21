import {createRequire} from 'node:module';
import {assertMacOSVersionGreaterThanOrEqualTo} from 'macos-version';
import {normalizeOptions} from './utils.js';

export {videoCodecs} from './utils.js';

const nativeModule = createRequire(import.meta.url)('./build/aperture.framework/Versions/A/aperture.node');

export class Recorder {
	constructor() {
		assertMacOSVersionGreaterThanOrEqualTo('13');
	}

	startRecordingScreen({
		screenId,
		...options
	}) {
		return this._startRecording('screen', {
			...options,
			targetId: screenId,
		});
	}

	startRecordingWindow({
		windowId,
		...options
	}) {
		return this._startRecording('window', {
			...options,
			targetId: windowId,
		});
	}

	startRecordingExternalDevice({
		deviceId,
		...options
	}) {
		return this._startRecording('externalDevice', {
			...options,
			targetId: deviceId,
		});
	}

	startRecordingAudio({
		audioDeviceId,
		losslessAudio,
		systemAudio,
	}) {
		return this._startRecording('audioOnly', {
			audioDeviceId,
			losslessAudio,
			systemAudio,
			extension: 'm4a',
		});
	}

	async _startRecording(targetType, options) {
		if (this.recorder !== undefined) {
			throw new Error('Call `.stopRecording()` first');
		}

		const {tmpPath, recorderOptions} = normalizeOptions(targetType, options);

		this.tmpPath = tmpPath;
		this.recorder = new nativeModule.Recorder();

		this.isFileReady = new Promise(resolve => {
			this.recorder.onStart = () => {
				resolve(this.tmpPath);
			};
		});

		const finalOptions = {
			destination: tmpPath,
			framesPerSecond: recorderOptions.framesPerSecond,
			showCursor: recorderOptions.showCursor,
			highlightClicks: recorderOptions.highlightClicks,
			losslessAudio: recorderOptions.losslessAudio,
			recordSystemAudio: recorderOptions.recordSystemAudio,
		};

		if (recorderOptions.videoCodec) {
			finalOptions.videoCodec = recorderOptions.videoCodec;
		}

		if (targetType === 'screen' && options.cropArea) {
			finalOptions.cropRect = options.cropArea;
		}

		if (recorderOptions.targetId) {
			finalOptions.targetId = recorderOptions.targetId;
		}

		if (recorderOptions.audioDeviceId) {
			finalOptions.microphoneDeviceID = recorderOptions.audioDeviceId;
		}

		await this.recorder.start(targetType, finalOptions);
	}

	throwIfNotStarted() {
		if (this.recorder === undefined) {
			throw new Error('Call `.startRecording()` first');
		}
	}

	async pause() {
		this.throwIfNotStarted();
		this.recorder.pause();
	}

	async resume() {
		this.throwIfNotStarted();
		this.recorder.resume();
	}

	async isPaused() {
		this.throwIfNotStarted();
		return this.recorder.isPaused();
	}

	async stopRecording() {
		this.throwIfNotStarted();
		await this.recorder.stop();

		delete this.recorder;
		delete this.isFileReady;

		return this.tmpPath;
	}
}

export const recorder = new Recorder();

export const screens = async () => nativeModule.getScreens();

export const windows = async ({
	excludeDesktopWindows = true,
	onScreenOnly = true,
} = {}) => nativeModule.getWindows(excludeDesktopWindows, onScreenOnly);

export const audioDevices = async () => nativeModule.getAudioDevices();

export const externalDevices = async () => nativeModule.getIOSDevices();
