// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "ApertureCLI",
	platforms: [
		.macOS(.v13)
	],
	products: [
		.executable(
			name: "aperture",
			targets: [
				"ApertureCLI"
			]
		),
		.library(
			name: "aperture-module",
			type: .dynamic,
			targets: ["ApertureModule"]
		)
	],
	dependencies: [
		.package(url: "https://github.com/wulkano/Aperture", branch: "george/rewrite-in-screen-capture-kit"),
		.package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.1"),
		.package(path: "node_modules/node-swift")
	],
	targets: [
		.executableTarget(
			name: "ApertureCLI",
			dependencies: [
				"Aperture",
				.product(name: "ArgumentParser", package: "swift-argument-parser")
			]
		),
		.target(
			name: "ApertureModule",
			dependencies: [
				"Aperture",
				.product(name: "NodeAPI", package: "node-swift"),
				.product(name: "NodeModuleSupport", package: "node-swift")
			]
		)
	]
)
