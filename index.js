'use strict';
const os = require('os');
const {debuglog} = require('util');
const path = require('path');
const execa = require('execa');
const tempy = require('tempy');
const macosVersion = require('macos-version');
const fileUrl = require('file-url');
const electronUtil = require('electron-util/node');
const delay = require('delay');

const log = debuglog('aperture');
const getRandomId = () => Math.random().toString(36).slice(2, 15);

// Workaround for https://github.com/electron/electron/issues/9459
const BIN = path.join(electronUtil.fixPathForAsarUnpack(__dirname), 'aperture');

const supportsHevcHardwareEncoding = (() => {
	const cpuModel = os.cpus()[0].model;

	// All Apple silicon Macs support HEVC hardware encoding.
	if (cpuModel.startsWith('Apple ')) { // Source string example: `'Apple M1'`
		return true;
	}

	// Get the Intel Core generation, the `4` in `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
	// More info: https://www.intel.com/content/www/us/en/processors/processor-numbers.html
	// Example strings:
	// - `Intel(R) Core(TM) i9-9980HK CPU @ 2.40GHz`
	// - `Intel(R) Core(TM) i7-4850HQ CPU @ 2.30GHz`
	const result = /Intel.*Core.*i\d+-(\d)/.exec(cpuModel);

	// Intel Core generation 6 or higher supports HEVC hardware encoding
	return result && Number.parseInt(result[1], 10) >= 6;
})();

class Aperture {
	constructor() {
		macosVersion.assertGreaterThanOrEqualTo('10.13');
	}

	startRecording({
		fps = 30,
		cropArea = undefined,
		showCursor = true,
		highlightClicks = false,
		screenId = 0,
		audioDeviceId = undefined,
		videoCodec = 'h264'
	} = {}) {
		this.processId = getRandomId();

		return new Promise((resolve, reject) => {
			if (this.recorder !== undefined) {
				reject(new Error('Call `.stopRecording()` first'));
				return;
			}

			this.tmpPath = tempy.file({extension: 'mp4'});

			if (highlightClicks === true) {
				showCursor = true;
			}

			if (typeof cropArea === 'object' &&
				(
					typeof cropArea.x !== 'number' ||
					typeof cropArea.y !== 'number' ||
					typeof cropArea.width !== 'number' ||
					typeof cropArea.height !== 'number'
				)
			) {
				reject(new Error('Invalid `cropArea` option object'));
				return;
			}

			const recorderOptions = {
				destination: fileUrl(this.tmpPath),
				framesPerSecond: fps,
				showCursor,
				highlightClicks,
				screenId,
				audioDeviceId
			};

			if (cropArea) {
				recorderOptions.cropRect = [
					[cropArea.x, cropArea.y],
					[cropArea.width, cropArea.height]
				];
			}

			if (videoCodec) {
				const codecMap = new Map([
					['h264', 'avc1'],
					['hevc', 'hvc1'],
					['proRes422', 'apcn'],
					['proRes4444', 'ap4h']
				]);

				if (!supportsHevcHardwareEncoding) {
					codecMap.delete('hevc');
				}

				if (!codecMap.has(videoCodec)) {
					throw new Error(`Unsupported video codec specified: ${videoCodec}`);
				}

				recorderOptions.videoCodec = codecMap.get(videoCodec);
			}

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

			this.recorder = execa(
				BIN, [
					'record',
					'--process-id',
					this.processId,
					JSON.stringify(recorderOptions)
				]
			);

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
		const {stdout} = await execa(
			BIN, [
				'events',
				'listen',
				'--process-id',
				this.processId,
				'--exit',
				name
			]
		);

		if (parse) {
			return parse(stdout.trim());
		}
	}

	async sendEvent(name, parse) {
		const {stdout} = await execa(
			BIN, [
				'events',
				'send',
				'--process-id',
				this.processId,
				name
			]
		);

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

module.exports = () => new Aperture();

module.exports.screens = async () => {
	const {stderr} = await execa(BIN, ['list', 'screens']);

	try {
		return JSON.parse(stderr);
	} catch {
		return stderr;
	}
};

module.exports.audioDevices = async () => {
	const {stderr} = await execa(BIN, ['list', 'audio-devices']);

	try {
		return JSON.parse(stderr);
	} catch {
		return stderr;
	}
};

Object.defineProperty(module.exports, 'videoCodecs', {
	get() {
		const codecs = new Map([
			['h264', 'H264'],
			['hevc', 'HEVC'],
			['proRes422', 'Apple ProRes 422'],
			['proRes4444', 'Apple ProRes 4444']
		]);

		if (!supportsHevcHardwareEncoding) {
			codecs.delete('hevc');
		}

		return codecs;
	}
});
