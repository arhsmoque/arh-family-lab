import Foundation

/// Reference boundary. Register BGTask identifiers in the generated application and Info.plist.
protocol BackgroundSyncCoordinating {
    func register()
    func scheduleBestEffortFlush()
}
