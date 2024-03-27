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

expectError(recorder.startRecording({videoCodec: 'random'}));

expectType<string | undefined>(await recorder.isFileReady);

expectType<string>(await recorder.stopRecording());

expectType<Map<VideoCodec, string>>(videoCodecs());
