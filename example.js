import fs from 'node:fs';
import timers from 'node:timers/promises';
import {
	recorder,
	screens,
	audioDevices,
	videoCodecs,
} from './index.js';

async function main() {
	console.log('Screens:', await screens());
	console.log('Audio devices:', await audioDevices());
	console.log('Video codecs:', videoCodecs);

	console.log('Preparing to record for 5 seconds');
	await recorder.startRecording();
	console.log('Recording started');
	await recorder.isFileReady;
	console.log('File is ready');
	await timers.setTimeout(5000);
	const fp = await recorder.stopRecording();
	fs.renameSync(fp, 'recording.mp4');
	console.log('Video saved in the current directory');
}

try {
	await main();
} catch (error) {
	console.error(error);
}

// Run: $ node example.js
