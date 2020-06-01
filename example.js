'use strict';
const path = require('path');
const delay = require('delay');
const aperture = require('.');

async function main() {
  const recorder = aperture();
  console.log('Screens:', await aperture.screens());
  console.log('Audio devices:', await aperture.audioDevices());
  console.log('Preparing to record for 5 seconds');
  await recorder.startRecording({
    destinationPath: path.join(__dirname, 'test.mp4')
  });
  console.log('Recording started');
  await delay(5000);
  const fp = await recorder.stopRecording();
  console.log('Video saved in the current directory', fp);
}

main().catch(console.error);

// Run: $ node example.js
