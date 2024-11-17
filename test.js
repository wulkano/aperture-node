import fs from 'node:fs';
import os from 'node:os';
import { execSync } from 'node:child_process';
import test from 'ava';
import delay from 'delay';
import {fileTypeFromBuffer} from 'file-type';
import {readChunk} from 'read-chunk';
import {
	recorder,
	audioDevices,
	screens,
	videoCodecs,
} from './index.js';

console.log(`Running on macOS ${os.arch()} ${os.version()}\n`);

(() => {
	let pid = process.pid;

	const getParentPid = (pid) => {
		return execSync(`ps -p ${pid} -o ppid=`).toString().trim();
	}

	const getCommand = (pid) => {
		return execSync(`ps -p ${pid} -o command=`).toString().trim();
	}

	while(true) {
		const parent = getParentPid(pid);

		if (parent === '0' || parent === '1') {
			const command = getCommand(pid);
			console.log(`Command: ${command}\n\n`);
			break;
		}

		pid = parent;
	}
})();

test('returns audio devices', async t => {
	const devices = await audioDevices();
	console.log('Audio devices:', devices);

	t.true(Array.isArray(devices));

	if (devices.length > 0) {
		t.true(devices[0].id.length > 0);
		t.true(devices[0].name.length > 0);
	}
});

test('returns screens', async t => {
	const monitors = await screens();
	console.log('Screens:', monitors);

	t.true(Array.isArray(monitors));

	if (monitors.length > 0) {
		t.true(monitors[0].id > 0);
		t.true(monitors[0].name.length > 0);
	}
});

test('returns available video codecs', t => {
	const codecs = videoCodecs;
	console.log('Video codecs:', codecs);
	t.true(codecs.has('h264'));
});

test('records screen', async t => {
	const monitors = await screens();
	await recorder.startRecordingScreen({screenId: monitors[0].id});
	t.true(fs.existsSync(await recorder.isFileReady));
	await delay(1000);
	const videoPath = await recorder.stopRecording();
	t.true(fs.existsSync(videoPath));
	const buffer = await readChunk(videoPath, {length: 4100});
	const fileType = await fileTypeFromBuffer(buffer);
	t.is(fileType.ext, 'mp4');
	fs.unlinkSync(videoPath);
});
