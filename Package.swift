// swift-tools-version:4.2
import PackageDescription

let package = Package(
  name: "ApertureCLI",
  products: [
    .executable(
      name: "aperture",
      targets: [
        "ApertureCLI"
      ]
    )
  ],
  dependencies: [
    .package(url: "https://github.com/wulkano/Aperture", from: "0.1.0")
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
