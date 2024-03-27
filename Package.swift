// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "ApertureCLI",
	platforms: [
		.macOS(.v10_13)
	],
	products: [
		.executable(
			name: "aperture",
			targets: [
				"ApertureCLI"
			]
		)
	],
	dependencies: [
		.package(url: "https://github.com/wulkano/Aperture", from: "2.0.1"),
		.package(url: "https://github.com/apple/swift-argument-parser", from: "1.3.1")
	],
	targets: [
		.executableTarget(
			name: "ApertureCLI",
			dependencies: [
				"Aperture",
				.product(name: "ArgumentParser", package: "swift-argument-parser")
			]
		)
	]
)
