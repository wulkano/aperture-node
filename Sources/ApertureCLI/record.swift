import AVFoundation
import Aperture

struct Options: Decodable {
	let destination: URL
	let targetId: String?
	let framesPerSecond: Int
	let cropRect: CGRect?
	let showCursor: Bool
	let highlightClicks: Bool
	let audioDeviceId: String?
	let videoCodec: String?
	let losslessAudio: Bool
	let recordSystemAudio: Bool
}

func record(_ optionsString: String, processId: String, targetType: TargetType) async throws {
	let options: Options = try optionsString.jsonDecoded()
	var observers = [Any]()

	let recorder = Aperture.Recorder()

	recorder.onStart = {
		ApertureEvents.sendEvent(processId: processId, event: OutEvent.onFileReady.rawValue)
	}

	recorder.onPause = {
		ApertureEvents.sendEvent(processId: processId, event: OutEvent.onPause.rawValue)
	}

	recorder.onResume = {
		ApertureEvents.sendEvent(processId: processId, event: OutEvent.onResume.rawValue)
	}

	recorder.onError = {
		print($0, to: .standardError)
		exit(1)
	}

	recorder.onFinish = {
		ApertureEvents.sendEvent(processId: processId, event: OutEvent.onFinish.rawValue)

		for observer in observers {
			DistributedNotificationCenter.default().removeObserver(observer)
		}

		exit(0)
	}

	CLI.onExit = {
		Task {
			try await recorder.stopRecording()
		}
		// Do not call `exit()` here as the video is not always done
		// saving at this point and will be corrupted randomly
	}

	observers.append(
		ApertureEvents.answerEvent(processId: processId, event: InEvent.pause.rawValue) { _ in
			try? recorder.pause()
		}
	)

	observers.append(
		ApertureEvents.answerEvent(processId: processId, event: InEvent.resume.rawValue) { _ in
			Task {
				try? await recorder.resume()
			}
		}
	)

	observers.append(
		ApertureEvents.answerEvent(processId: processId, event: InEvent.isPaused.rawValue) { notification in
			notification.answer(recorder.isPaused)
		}
	)

	let videoCodec: Aperture.VideoCodec
	if let videoCodecString = options.videoCodec {
		videoCodec = try .fromRawValue(videoCodecString)
	} else {
		videoCodec = .h264
	}

	let target: Aperture.Target

	switch targetType {
	case .screen:
		target = .screen
	case .window:
		target = .window
	case .audio:
		target = .audioOnly
	case .externalDevice:
		target = .externalDevice
	}

	try await recorder.startRecording(
		target: target,
		options: Aperture.RecordingOptions(
			destination: options.destination,
			targetID: options.targetId,
			framesPerSecond: options.framesPerSecond,
			cropRect: options.cropRect,
			showCursor: options.showCursor,
			highlightClicks: options.highlightClicks,
			videoCodec: videoCodec,
			losslessAudio: options.losslessAudio,
			recordSystemAudio: options.recordSystemAudio,
			microphoneDeviceID: options.audioDeviceId != nil ? options.audioDeviceId : nil
		)
	)

	ApertureEvents.sendEvent(processId: processId, event: OutEvent.onStart.rawValue)
}
