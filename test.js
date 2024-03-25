import fs from 'node:fs';
import test from 'ava';
import delay from 'delay';
import {fileTypeFromBuffer} from 'file-type';
import {readChunk} from 'read-chunk';
import aperture from './index.js';

test('returns audio devices', async t => {
	const devices = await aperture.audioDevices();
	console.log('Audio devices:', devices);

	t.true(Array.isArray(devices));

	if (devices.length > 0) {
		t.true(devices[0].id.length > 0);
		t.true(devices[0].name.length > 0);
	}
});

test('returns available video codecs', t => {
	const codecs = aperture.videoCodecs;
	console.log('Video codecs:', codecs);
	t.true(codecs.has('h264'));
});

test('records screen', async t => {
	const recorder = aperture();
	await recorder.startRecording();
	t.true(fs.existsSync(await recorder.isFileReady));
	await delay(1000);
	const videoPath = await recorder.stopRecording();
	t.true(fs.existsSync(videoPath));
	const buffer = await readChunk(videoPath, {length: 4100});
	const fileType = await fileTypeFromBuffer(buffer);
	t.is(fileType.ext, 'mov');
	fs.unlinkSync(videoPath);
});
