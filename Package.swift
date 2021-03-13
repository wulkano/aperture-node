// swift-tools-version:5.3
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
    .package(url: "https://github.com/wulkano/Aperture", from: "0.4.0"),
    .package(url: "https://github.com/apple/swift-argument-parser", from: "0.4.0")
  ],
  targets: [
    .target(
      name: "ApertureCLI",
      dependencies: [
        "Aperture",
        .product(name: "ArgumentParser", package: "swift-argument-parser")
      ]
    )
  ]
)
