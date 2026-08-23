import Foundation

struct FamilyWidgetSnapshot: Codable {
    let generatedAt: Date
    let householdId: String
    let memberScope: String?
    let pendingCount: Int
    let attentionCount: Int
    let confidence: String
    let deepLink: URL
}
