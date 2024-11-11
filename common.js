import os from 'node:os';
import {temporaryFile} from 'tempy';
import fileUrl from 'file-url';

export const supportsHevcHardwareEncoding = (() => {
	const cpuModel = os.cpus()[0].model;

	// All Apple silicon Macs support HEVC hardware encoding.
	if (cpuModel.startsWith('Apple ')) {
		// Source string example: `'Apple M1'`
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

export const videoCodecs = new Map([
	['h264', 'H264'],
	['hevc', 'HEVC'],
	['proRes422', 'Apple ProRes 422'],
	['proRes4444', 'Apple ProRes 4444'],
]);

if (!supportsHevcHardwareEncoding) {
	videoCodecs.delete('hevc');
}

export function normalizeOptions(targetType, {
	targetId = undefined,
	fps = 30,
	cropArea = undefined,
	showCursor = true,
	highlightClicks = false,
	audioDeviceId = undefined,
	videoCodec = 'h264',
	losslessAudio = false,
	systemAudio = false,
	extension = videoCodec === 'proRes422' || videoCodec === 'proRes4444' ? 'mov' : 'mp4',
} = {}) {
	const recorderOptions = {
		targetId,
		framesPerSecond: fps,
		showCursor,
		highlightClicks,
		audioDeviceId,
		losslessAudio,
		recordSystemAudio: systemAudio,
	};

	if (videoCodec && targetType !== 'audio') {
		const codecMap = new Map([
			['h264', ['mp4', 'mov', 'm4v']],
			['hevc', ['mp4', 'mov', 'm4v']],
			['proRes422', ['mov']],
			['proRes4444', ['mov']],
		]);

		if (!supportsHevcHardwareEncoding) {
			codecMap.delete('hevc');
		}

		const allowedExtensions = codecMap.get(videoCodec);

		if (!allowedExtensions) {
			throw new Error(`Unsupported video codec specified: ${videoCodec}`);
		}

		if (!allowedExtensions.includes(extension)) {
			throw new Error(`The video codec ${videoCodec} does not support the extension ${extension}. Allowed extensions: ${allowedExtensions.join(', ')}`);
		}

		recorderOptions.videoCodec = videoCodec;
	}

	const temporaryPath = temporaryFile({
		extension: targetType === 'audio' ? 'm4a' : extension,
	});

	recorderOptions.destination = fileUrl(temporaryPath);

	if (highlightClicks === true) {
		recorderOptions.showCursor = true;
	}

	if (targetType === 'screen' && cropArea) {
		recorderOptions.cropRect = [
			[cropArea.x, cropArea.y],
			[cropArea.width, cropArea.height],
		];
	}

	return {
		tmpPath: temporaryPath,
		recorderOptions,
	};
}
