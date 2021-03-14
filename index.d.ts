declare namespace aperture {
  type Screen = {
    id: number;
    name: string;
  };

  type AudioDevice = {
    id: string;
    name: string;
  };

  type VideoCodec = 'h264' | 'hevc' | 'proRes422' | 'proRes4444';

  type RecordingOptions = {
    /**
    Number of frames per seconds.
    */
    readonly fps?: number;

    /**
    Record only an area of the screen.
    */
    readonly cropArea?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    /**
    Show the cursor in the screen recording.
    */
    readonly showCursor?: boolean;

    /**
    Highlight cursor clicks in the screen recording.

    Enabling this will also enable the `showCursor` option.
    */
    readonly highlightClicks?: boolean;

    /**
    Screen to record.

    Defaults to primary screen.
    */
    readonly screenId?: number;

    /**
    Audio device to include in the screen recording.

    Should be one of the `id`'s from `aperture.audioDevices()`.
    */
    readonly audioDeviceId?: string;

    /**
    Video codec to use.

    A computer with Intel 6th generation processor or newer is strongly recommended for the `hevc` codec, as otherwise it will use software encoding, which only produces 3 FPS fullscreen recording.

    The `proRes422` and `proRes4444` codecs are uncompressed data. They will create huge files.
    */
    readonly videoCodec?: VideoCodec;
  };

  interface Recorder {
    /**
    Returns a `Promise` that fullfills when the recording starts or rejects if the recording didn't start after 5 seconds.
    */
    startRecording: (options?: RecordingOptions) => Promise<void>;

    /**
    `Promise` that fullfills with the path to the screen recording file when it's ready. This will never reject.

    Only available while a recording is happening, `undefined` otherwise.

    Usually, this resolves around 1 second before the recording starts, but that's not guaranteed.
    */
    isFileReady: Promise<string> | undefined;

    /**
    Pauses the recording. To resume, call `recorder.resume()`.

    Returns a `Promise` that fullfills when the recording has been paused.
    */
    pause: () => Promise<void>;

    /**
    Resumes the recording if it's been paused.

    Returns a `Promise` that fullfills when the recording has been resumed.
    */
    resume: () => Promise<void>;

    /**
    Returns a `Promise` that resolves with a boolean indicating whether or not the recording is currently paused.
    */
    isPaused: () => Promise<boolean>;

    /**
    Returns a `Promise` for the path to the screen recording file.
    */
    stopRecording: () => Promise<string>;
  }
}

declare const aperture: (() => aperture.Recorder) & {
  /**
  Get a list of available video codecs.

  The key is the `videoCodec` option name and the value is the codec name.

  It only returns `hevc` if your computer supports HEVC hardware encoding.

  @example
  ```
  Map {
    'h264' => 'H264',
    'hevc' => 'HEVC',
    'proRes422' => 'Apple ProRes 422',
    'proRes4444' => 'Apple ProRes 4444'
  }
  ```
  */
  videoCodecs: Map<aperture.VideoCodec, string>;

  /**
  Get a list of screens.

  The first screen is the primary screen.

  @example
  ```
  [{
    id: 69732482,
    name: 'Color LCD'
  }]
  ```
  */
  screens: () => Promise<aperture.Screen[]>;

  /**
  Get a list of audio devices.

  @example
  ```
  [{
    id: 'AppleHDAEngineInput:1B,0,1,0:1',
    name: 'Built-in Microphone'
  }]
  ```
  */
  audioDevices: () => Promise<aperture.AudioDevice[]>;
};

export = aperture;
