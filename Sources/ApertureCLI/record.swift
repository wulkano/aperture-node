import AVFoundation
import Aperture

struct Options: Decodable {
  let destination: URL
  let framesPerSecond: Int
  let cropRect: CGRect?
  let showCursor: Bool
  let highlightClicks: Bool
  let screenId: CGDirectDisplayID
  let audioDeviceId: String?
  let videoCodec: String?
}

func record(_ optionsString: String, processId: String) throws {
  setbuf(__stdoutp, nil)
  let options: Options = try optionsString.jsonDecoded()
  var observers: [Any] = []

  let recorder = try Aperture(
    destination: options.destination,
    framesPerSecond: options.framesPerSecond,
    cropRect: options.cropRect,
    showCursor: options.showCursor,
    highlightClicks: options.highlightClicks,
    screenId: options.screenId == 0 ? .main : options.screenId,
    audioDevice: options.audioDeviceId != nil ? AVCaptureDevice(uniqueID: options.audioDeviceId!) : nil,
    videoCodec: options.videoCodec != nil ? AVVideoCodecType(rawValue: options.videoCodec!) : nil
  )

  recorder.onStart = {
    ApertureEvents.sendEvent(processId: processId, event: OutEvent.onFileReady.rawValue)
  }

  recorder.onPause = {
    ApertureEvents.sendEvent(processId: processId, event: OutEvent.onPause.rawValue)
  }

  recorder.onResume = {
    ApertureEvents.sendEvent(processId: processId, event: OutEvent.onResume.rawValue)
  }

  recorder.onFinish = { error in
    if let error = error {
      print(error, to: .standardError)
      exit(1)
    }

    ApertureEvents.sendEvent(processId: processId, event: OutEvent.onFinish.rawValue)

    for observer in observers {
      DistributedNotificationCenter.default().removeObserver(observer)
    }

    exit(0)
  }

  CLI.onExit = {
    recorder.stop()
    // Do not call `exit()` here as the video is not always done
    // saving at this point and will be corrupted randomly
  }

  observers.append(
    ApertureEvents.answerEvent(processId: processId, event: InEvent.pause.rawValue) { _ in
      recorder.pause()
    }
  )

  observers.append(
    ApertureEvents.answerEvent(processId: processId, event: InEvent.resume.rawValue) { _ in
      recorder.resume()
    }
  )

  observers.append(
    ApertureEvents.answerEvent(processId: processId, event: InEvent.isPaused.rawValue) { notification in
      notification.answer(recorder.isPaused)
    }
  )

  recorder.start()
  ApertureEvents.sendEvent(processId: processId, event: OutEvent.onStart.rawValue)

  RunLoop.main.run()
}
