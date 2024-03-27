import {expectType, expectError} from 'tsd';
import type {Recorder, Screen, AudioDevice, VideoCodec} from './index.js';
import {recorder, audioDevices, screens, videoCodecs} from './index.js';

expectType<Recorder>(recorder);

expectType<AudioDevice[]>(await audioDevices());

expectType<Screen[]>(await screens());

expectError(recorder.startRecording({videoCodec: 'random'}));

expectType<string | undefined>(await recorder.isFileReady);

expectType<string>(await recorder.stopRecording());

expectType<Map<VideoCodec, string>>(videoCodecs());
