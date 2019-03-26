// swift-tools-version:5.0
import PackageDescription

let package = Package(
  name: "ApertureCLI",
  platforms: [
    .macOS(.v10_12)
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
    .package(url: "https://github.com/wulkano/Aperture", from: "0.2.0")
  ],
  targets: [
    .target(
      name: "ApertureCLI",
      dependencies: [
        "Aperture"
      ]
    )
  ]
)
