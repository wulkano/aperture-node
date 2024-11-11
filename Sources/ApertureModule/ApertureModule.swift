import NodeAPI
import Aperture
import Foundation
import AVFoundation



@NodeClass final class Recorder {
	@NodeActor
	private var recorder: Aperture.Recorder

	private let nodeQueue: NodeAsyncQueue

	@NodeActor
	@NodeConstructor
	init () throws {
		self.recorder = Aperture.Recorder()
		self.nodeQueue = try NodeAsyncQueue(label: "Node Queue")
	}

	@NodeActor
	@NodeMethod
	func startRecording(_ targetString: NodeString, _ options: NodeObject) async throws {
		let target: Aperture.Target

		switch try targetString.string() {
		case "screen":
			target = .screen
		case "window":
			target = .window
		case "audioOnly":
			target = .audioOnly
		case "externalDevice":
			target = .externalDevice
		default:
			throw try NodeError(code: nil, message: "Invalid value provided for target. screen, window, audioOnly or externalDevice expected.")
		}

		try await self.recorder.startRecording(target: target, options: options.asOptions())
	}

	@NodeActor
	@NodeMethod
	func stopRecording() async throws {
		try await self.recorder.stopRecording()
	}

	@NodeActor
	@NodeMethod
	func pause() {
		self.recorder.pause()
	}

	@NodeActor
	@NodeMethod
	func resume() {
		self.recorder.resume()
	}

	@NodeActor
	@NodeMethod
	func isPaused() async -> Bool {
		self.recorder.isPaused
	}

	@NodeActor private var _onFinish: NodeFunction?
	@NodeActor @NodeProperty var onFinish: NodeFunction? {
		get {
			_onFinish
		}
		set {
			_onFinish = newValue

			if let newValue {
				self.recorder.onFinish = {
					try? self.nodeQueue.run {
						_ = try? newValue.call([])
					}
				}
			} else {
				self.recorder.onFinish = nil
			}
		}
	}

	@NodeActor private var _onStart: NodeFunction?
	@NodeActor @NodeProperty var onStart: NodeFunction? {
		get {
			_onStart
		}
		set {
			_onStart = newValue

			if let newValue {
				self.recorder.onStart = {
					try? self.nodeQueue.run {
						_ = try? newValue.call([])
					}
				}
			} else {
				self.recorder.onStart = nil
			}
		}
	}

	@NodeActor private var _onPause: NodeFunction?
	@NodeActor @NodeProperty var onPause: NodeFunction? {
		get {
			_onPause
		}
		set {
			_onPause = newValue

			if let newValue {
				self.recorder.onPause = {
					try? self.nodeQueue.run {
						_ = try? newValue.call([])
					}
				}
			} else {
				self.recorder.onPause = nil
			}
		}
	}

	@NodeActor private var _onResume: NodeFunction?
	@NodeActor @NodeProperty var onResume: NodeFunction? {
		get {
			_onResume
		}
		set {
			_onResume = newValue

			if let newValue {
				self.recorder.onResume = {
					try? self.nodeQueue.run {
						_ = try? newValue.call([])
					}
				}
			} else {
				self.recorder.onResume = nil
			}
		}
	}

	@NodeActor private var _onError: NodeFunction?
	@NodeActor @NodeProperty var onError: NodeFunction? {
		get {
			_onError
		}
		set {
			_onError = newValue

			if let newValue {
				self.recorder.onError = { error in
					try? self.nodeQueue.run {
						_ = try? newValue.call([
							try NodeError(code: nil, message: error.localizedDescription)
						])
					}
				}
			} else {
				self.recorder.onError = nil
			}
		}
	}
}

#NodeModule(exports: [
	"getScreens": try NodeFunction { () async throws in
		let screens = try await Aperture.Devices.screen()
		return screens as [any NodeValueConvertible]
	},
	"getWindows": try NodeFunction { (excludeDesktopWindows: Bool, onScreenWindowsOnly: Bool) async throws in
		let windows = try await Aperture.Devices.window(excludeDesktopWindows: excludeDesktopWindows, onScreenWindowsOnly: onScreenWindowsOnly)
		return windows as [any NodeValueConvertible]
	},
	"getAudioDevices": try NodeFunction { () async in
		let audioDevices = Aperture.Devices.audio()
		return audioDevices as [any NodeValueConvertible]
	},
	"getIOSDevices": try NodeFunction { () async in
		let iosDevices = Aperture.Devices.iOS()
		return iosDevices as [any NodeValueConvertible]
	},
	"Recorder": Recorder.deferredConstructor
])

extension NodeObject {
	func getAs<T: AnyNodeValueCreatable>(_ name: String, type: T.Type) throws -> T? {
		if try self.hasOwnProperty(name) {
			guard let value = try self[name].as(T.self) else {
				throw try NodeError(code: nil, message: "Invalid value provided for \(name). \(type) expected.")
			}

			return value
		}
			return nil
	}

	func getAsRequired<T: AnyNodeValueCreatable>(_ name: String, type: T.Type, errorMessage: String? = nil) throws -> T {
		guard let value = try getAs(name, type: type.self) else {
			throw try NodeError(code: nil, message: "\(name) is required")
		}

		return value
	}
}

extension NodeObject {
	func asCGRect() throws -> CGRect {
		CGRect(
			origin: CGPoint(
				x: try getAsRequired("x", type: Int.self),
				y: try getAsRequired("y", type: Int.self)
			),
			size: CGSize(
				width: try getAsRequired("width", type: Int.self),
				height: try getAsRequired("height", type: Int.self)
			)
		)
	}

	func asOptions() throws -> Aperture.RecordingOptions {
		let destinationPath = try self.getAsRequired("destination", type: String.self)
		let destination = URL(fileURLWithPath: destinationPath)

		let videoCodecString = try getAs("videoCodec", type: String.self)
		let videoCodec: Aperture.VideoCodec?

		if let videoCodecString {
			do {
				videoCodec = try .fromRawValue(videoCodecString)
			} catch {
				throw try NodeError(code: nil, message: "Invalid value provided for videoCodec. h264, hevc, proRes422 or proRes4444 expected.")
			}
		} else {
			videoCodec = nil
		}

		return Aperture.RecordingOptions(
			destination: destination,
			targetID: try getAs("targetId", type: String.self),
			framesPerSecond: try getAs("framesPerSecond", type: Int.self) ?? 60,
			cropRect: try getAs("cropRect", type: NodeObject.self)?.asCGRect(),
			showCursor: try getAs("showCursor", type: Bool.self) ?? true,
			highlightClicks: try getAs("highlightClicks", type: Bool.self) ?? false,
			videoCodec: videoCodec ?? .h264,
			losslessAudio: try getAs("losslessAudio", type: Bool.self) ?? false,
			recordSystemAudio: try getAs("recordSystemAudio", type: Bool.self) ?? false,
			microphoneDeviceID: try getAs("microphoneDeviceID", type: String.self)
		)
	}
}

extension CGRect: @retroactive NodeValueConvertible {
	public func nodeValue() throws -> any NodeValue {
		try NodeObject([
			"x": Int(self.origin.x),
			"y": Int(self.origin.y),
			"width": Int(self.size.width),
			"height": Int(self.size.height)
		])
	}
}

extension Aperture.Devices.Screen: @retroactive NodeValueConvertible {
	public func nodeValue() throws -> any NodeValue {
		try NodeObject([
			"id": String(self.id),
			"name": self.name,
			"width": self.width,
			"height": self.height,
			"frame": self.frame.nodeValue()
		])
	}
}

extension Aperture.Devices.Window: @retroactive NodeValueConvertible {
	public func nodeValue() throws -> any NodeValue {
		try NodeObject([
			"id": String(self.id),
			"title": self.title,
			"frame": self.frame.nodeValue(),
			"applicationName": self.applicationName,
			"applicationBundleIdentifier": self.applicationBundleIdentifier,
			"isActive": self.isActive,
			"isOnScreen": self.isOnScreen,
			"layer": self.layer
		])
	}
}

extension Aperture.Devices.Audio: @retroactive NodeValueConvertible {
	public func nodeValue() throws -> any NodeValue {
		try NodeObject([
			"id": String(self.id),
			"name": self.name
		])
	}
}

extension Aperture.Devices.IOS: @retroactive NodeValueConvertible {
	public func nodeValue() throws -> any NodeValue {
		try NodeObject([
			"id": String(self.id),
			"name": self.name
		])
	}
}
