import Foundation
import Aperture
import ArgumentParser

enum OutEvent: String, CaseIterable, ExpressibleByArgument {
	case onStart
	case onFileReady
	case onPause
	case onResume
	case onFinish
}

enum TargetType: String, CaseIterable, ExpressibleByArgument {
	case screen
	case window
	case audio
	case externalDevice
}

enum InEvent: String, CaseIterable, ExpressibleByArgument {
	case pause
	case resume
	case isPaused
	case onPause
}

extension CaseIterable {
	static var asCommaSeparatedList: String {
		allCases.map { "\($0)" }.joined(separator: ", ")
	}
}

@main
struct ApertureCLI: ParsableCommand {
	static let configuration = CommandConfiguration(
		commandName: "aperture",
		subcommands: [
			List.self,
			Record.self,
			Events.self
		]
	)
}

extension ApertureCLI {
	struct List: ParsableCommand {
		static let configuration = CommandConfiguration(
			subcommands: [
				Screens.self,
				AudioDevices.self,
				Windows.self,
				ExternalDevices.self
			]
		)
	}

	struct Record: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "Start a recording with the given options.")

		@Option(name: .shortAndLong, help: "The ID to use for this process")
		var processId = "main"

		@Option(name: .shortAndLong, help: "The type of target to record")
		var targetType = TargetType.screen

		@Argument(help: "Stringified JSON object with options passed to Aperture")
		var options: String

		mutating func run() throws {
			Task { [self] in
				do {
					try await record(options, processId: processId, targetType: targetType)
				} catch {
					print(error, to: .standardError)
					Darwin.exit(1)
				}
			}

			RunLoop.main.run()
		}
	}

	struct Events: ParsableCommand {
		static let configuration = CommandConfiguration(
			subcommands: [
				Send.self,
				Listen.self,
				ListenAll.self
			]
		)
	}
}

extension ApertureCLI.List {
	struct Screens: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "List available screens.")

		mutating func run() throws {
			Task {
				// Uses stderr because of unrelated stuff being outputted on stdout.
				print(
					try toJson(
						await Aperture.Devices.screen().map {
							[
								"id": $0.id,
								"name": $0.name,
								"width": $0.width,
								"height": $0.height,
								"frame": $0.frame.asDictionary
							]
						}
					),
					to: .standardError
				)
				Darwin.exit(0)
			}

			RunLoop.main.run()
		}
	}

	struct Windows: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "List available windows.")

		@Flag(inversion: .prefixedNo, help: "Exclude desktop windows")
		var excludeDesktopWindows = true

		@Flag(inversion: .prefixedNo, help: "Only include windows that are on screen")
		var onScreenOnly = true

		mutating func run() throws {
			Task { [self] in
				// Uses stderr because of unrelated stuff being outputted on stdout.
				print(
					try toJson(
						await Aperture.Devices.window(
							excludeDesktopWindows: excludeDesktopWindows,
							onScreenWindowsOnly: onScreenOnly
						)
						.map {
							[
								"id": $0.id,
								"title": $0.title as Any,
								"applicationName": $0.applicationName as Any,
								"applicationBundleIdentifier": $0.applicationBundleIdentifier as Any,
								"isActive": $0.isActive,
								"isOnScreen": $0.isOnScreen,
								"layer": $0.layer,
								"frame": $0.frame.asDictionary
							]
						}
					),
					to: .standardError
				)

				Darwin.exit(0)
			}

			RunLoop.main.run()
		}
	}

	struct AudioDevices: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "List available audio devices.")

		mutating func run() throws {
			// Uses stderr because of unrelated stuff being outputted on stdout.
			print(try toJson(Aperture.Devices.audio().map { ["id": $0.id, "name": $0.name] }), to: .standardError)
		}
	}

	struct ExternalDevices: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "List available external devices.")

		mutating func run() throws {
			// Uses stderr because of unrelated stuff being outputted on stdout.
			print(try toJson(Aperture.Devices.iOS().map { ["id": $0.id, "name": $0.name] }), to: .standardError)
		}
	}
}

extension ApertureCLI.Events {
	struct Send: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "Send an event to the given process.")

		@Flag(inversion: .prefixedNo, help: "Wait for event to be received")
		var wait = true

		@Option(name: .shortAndLong, help: "The ID of the target process")
		var processId = "main"

		@Argument(help: "Name of the event to send. Can be one of:\n\(InEvent.asCommaSeparatedList)")
		var event: InEvent

		@Argument(help: "Data to pass to the event")
		var data: String?

		mutating func run() {
			ApertureEvents.sendEvent(processId: processId, event: event.rawValue, data: data) { notification in
				if let data = notification.data {
					print(data)
				}

				Foundation.exit(0)
			}

			if wait {
				RunLoop.main.run()
			}
		}
	}

	struct Listen: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "Listen to an outcoming event for the given process.")

		@Flag(help: "Exit after receiving the event once")
		var exit = false

		@Option(name: .shortAndLong, help: "The ID of the target process")
		var processId = "main"

		@Argument(help: "Name of the event to listen for. Can be one of:\n\(OutEvent.asCommaSeparatedList)")
		var event: OutEvent

		func run() {
			_ = ApertureEvents.answerEvent(processId: processId, event: event.rawValue) { notification in
				if let data = notification.data {
					print(data)
				}

				if exit {
					notification.answer()
					Foundation.exit(0)
				}
			}

			RunLoop.main.run()
		}
	}

	struct ListenAll: ParsableCommand {
		static let configuration = CommandConfiguration(abstract: "Listen to all outcoming events for the given process.")

		@Option(name: .shortAndLong, help: "The ID of the target process")
		var processId = "main"

		func run() {
			for event in OutEvent.allCases {
				_ = ApertureEvents.answerEvent(processId: processId, event: event.rawValue) { notification in
					if let data = notification.data {
						print("\(event) \(data)")
					} else {
						print(event)
					}
				}
			}

			RunLoop.main.run()
		}
	}
}
