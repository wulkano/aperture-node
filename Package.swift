// swift-tools-version:5.4
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
    .package(url: "https://github.com/tapehq/Aperture", .branch("try/5.2.0+scalefactor")),
    .package(url: "https://github.com/apple/swift-argument-parser", from: "0.4.2")
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
