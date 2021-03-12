import {expectType, expectError} from 'tsd';
import {Recorder, Screen, AudioDevice, VideoCodec} from '.';

import aperture = require('.');

const recorder = aperture();

expectType<Recorder>(recorder);

(async () => {
  expectType<AudioDevice[]>(await aperture.audioDevices());
  expectType<Screen[]>(await aperture.screens());

  expectError(recorder.startRecording({videoCodec: 'random'}));

  expectType<string | undefined>(await recorder.isFileReady);

  expectType<string>(await recorder.stopRecording());
})();

expectType<Map<VideoCodec, string>>(aperture.videoCodecs);
