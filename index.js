import {debuglog} from 'node:util';
import path from 'node:path';
import url from 'node:url';
import {execa} from 'execa';
import {assertMacOSVersionGreaterThanOrEqualTo} from 'macos-version';
import {fixPathForAsarUnpack} from 'electron-util/node';
import delay from 'delay';
import {normalizeOptions} from './common.js';

export {videoCodecs} from './common.js';

const log = debuglog('aperture');
const getRandomId = () => Math.random().toString(36).slice(2, 15);

const dirname_ = path.dirname(url.fileURLToPath(import.meta.url));
// Workaround for https://github.com/electron/electron/issues/9459
const BINARY = path.join(fixPathForAsarUnpack(dirname_), 'aperture');

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
		return this._startRecording('audio', {
			audioDeviceId,
			losslessAudio,
			systemAudio,
			extension: 'm4a',
		});
	}

	_startRecording(targetType, options) {
		this.processId = getRandomId();

		return new Promise((resolve, reject) => {
			if (this.recorder !== undefined) {
				reject(new Error('Call `.stopRecording()` first'));
				return;
			}

			const {tmpPath, recorderOptions} = normalizeOptions(targetType, options);

			this.tmpPath = tmpPath;

			const timeout = setTimeout(() => {
				// `.stopRecording()` was called already
				if (this.recorder === undefined) {
					return;
				}

				const error = new Error('Could not start recording within 5 seconds');
				error.code = 'RECORDER_TIMEOUT';
				this.recorder.kill();
				delete this.recorder;
				reject(error);
			}, 5000);

			(async () => {
				try {
					await this.waitForEvent('onStart');
					clearTimeout(timeout);
					setTimeout(resolve, 1000);
				} catch (error) {
					reject(error);
				}
			})();

			this.isFileReady = (async () => {
				await this.waitForEvent('onFileReady');
				return this.tmpPath;
			})();

			this.recorder = execa(BINARY, [
				'record',
				'--process-id',
				this.processId,
				'--target-type',
				targetType,
				JSON.stringify(recorderOptions),
			]);

			this.recorder.catch(error => {
				clearTimeout(timeout);
				delete this.recorder;
				reject(error);
			});

			this.recorder.stdout.setEncoding('utf8');
			this.recorder.stdout.on('data', log);
		});
	}

	async waitForEvent(name, parse) {
		const {stdout} = await execa(BINARY, [
			'events',
			'listen',
			'--process-id',
			this.processId,
			'--exit',
			name,
		]);

		if (parse) {
			return parse(stdout.trim());
		}
	}

	async sendEvent(name, parse) {
		const {stdout} = await execa(BINARY, [
			'events',
			'send',
			'--process-id',
			this.processId,
			name,
		]);

		if (parse) {
			return parse(stdout.trim());
		}
	}

	throwIfNotStarted() {
		if (this.recorder === undefined) {
			throw new Error('Call `.startRecording()` first');
		}
	}

	async pause() {
		this.throwIfNotStarted();
		await this.sendEvent('pause');
	}

	async resume() {
		this.throwIfNotStarted();

		await this.sendEvent('resume');

		// It takes about 1s after the promise resolves for the recording to actually start
		await delay(1000);
	}

	async isPaused() {
		this.throwIfNotStarted();

		return this.sendEvent('isPaused', value => value === 'true');
	}

	async stopRecording() {
		this.throwIfNotStarted();

		this.recorder.kill();
		await this.recorder;
		delete this.recorder;
		delete this.isFileReady;

		return this.tmpPath;
	}
}

export const recorder = new Recorder();

const removeWarnings = string => string.split('\n').filter(line => !line.includes('] WARNING:')).join('\n');

export const screens = async () => {
	const {stderr} = await execa(BINARY, ['list', 'screens']);

	try {
		return JSON.parse(removeWarnings(stderr));
	} catch (error) {
		throw new Error(stderr, {cause: error});
	}
};

export const windows = async ({
	excludeDesktopWindows = true,
	onScreenOnly = true,
} = {}) => {
	const {stderr} = await execa(BINARY, [
		'list',
		'windows',
		excludeDesktopWindows ? '--exclude-desktop-windows' : '--no-exclude-desktop-windows',
		onScreenOnly ? '--on-screen-only' : '--no-on-screen-only',
	]);

	try {
		return JSON.parse(removeWarnings(stderr));
	} catch (error) {
		throw new Error(stderr, {cause: error});
	}
};

export const audioDevices = async () => {
	const {stderr} = await execa(BINARY, ['list', 'audio-devices']);

	try {
		return JSON.parse(removeWarnings(stderr));
	} catch (error) {
		throw new Error(stderr, {cause: error});
	}
};

export const externalDevices = async () => {
	const {stderr} = await execa(BINARY, ['list', 'external-devices']);

	try {
		return JSON.parse(removeWarnings(stderr));
	} catch (error) {
		throw new Error(stderr, {cause: error});
	}
};
