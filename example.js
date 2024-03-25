import fs from 'node:fs';
import timers from 'node:timers/promises';
import aperture from './index.js';

async function main() {
	const recorder = aperture();
	console.log('Screens:', await aperture.screens());
	console.log('Audio devices:', await aperture.audioDevices());
	console.log('Video codecs:', aperture.videoCodecs);

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
