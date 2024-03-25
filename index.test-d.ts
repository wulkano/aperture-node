import {expectType, expectError} from 'tsd';
import {type Recorder, type Screen, type AudioDevice, type VideoCodec} from './index.js';
import aperture from './index.js';

const recorder = aperture();

expectType<Recorder>(recorder);

expectType<AudioDevice[]>(await aperture.audioDevices());

expectType<Screen[]>(await aperture.screens());

expectError(recorder.startRecording({videoCodec: 'random'}));

expectType<string | undefined>(await recorder.isFileReady);

expectType<string>(await recorder.stopRecording());

expectType<Map<VideoCodec, string>>(aperture.videoCodecs);
