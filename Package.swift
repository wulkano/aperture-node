// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "aperture",
	platforms: [
		.macOS(.v13)
	],
	products: [
		.library(
			name: "aperture",
			type: .dynamic,
			targets: ["ApertureNode"]
		)
	],
	dependencies: [
		.package(url: "https://github.com/wulkano/Aperture", branch: "george/rewrite-in-screen-capture-kit"),
		.package(path: "node_modules/node-swift")
	],
	targets: [
		.target(
			name: "ApertureNode",
			dependencies: [
				"Aperture",
				.product(name: "NodeAPI", package: "node-swift"),
				.product(name: "NodeModuleSupport", package: "node-swift")
			]
		)
	]
)
