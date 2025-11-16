import {expectType, expectError} from 'tsd';
import {
	recorder,
	audioDevices,
	screens,
	videoCodecs,
	type Recorder,
	type Screen,
	type AudioDevice,
	type VideoCodec,
} from './index.js';

expectType<Recorder>(recorder);

expectType<AudioDevice[]>(await audioDevices());

expectType<Screen[]>(await screens());

expectError(recorder.startRecordingScreen({}));

expectError(recorder.startRecordingScreen({screenId: '1', videoCodec: 'random'}));

expectError(recorder.startRecordingScreen({screenId: '1', videoCodec: 'proRes422', extension: 'mp4'}));

expectType<Promise<void>>(recorder.startRecordingScreen({screenId: '1', videoCodec: 'proRes422', extension: 'mov'}));

expectType<Promise<void>>(recorder.startRecordingScreen({screenId: '1', extension: 'mp4'}));

expectType<Promise<void>>(recorder.startRecordingScreen({screenId: '1'}));

expectError(recorder.startRecordingWindow({}));

expectType<Promise<void>>(recorder.startRecordingWindow({windowId: '1'}));

expectError(recorder.startRecordingExternalDevice({}));

expectType<Promise<void>>(recorder.startRecordingExternalDevice({deviceId: '1'}));

expectError(recorder.startRecordingAudio({losslessAudio: true}));

expectType<Promise<void>>(recorder.startRecordingAudio({systemAudio: true, audioDeviceId: '1'}));

expectType<string | undefined>(await recorder.isFileReady);

expectType<string>(await recorder.stopRecording());

expectType<Map<VideoCodec, string>>(videoCodecs());
