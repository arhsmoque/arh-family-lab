import Foundation

struct ParentAuthorisationResult {
    let authorised: Bool
    let method: String
}

protocol ParentAuthorising {
    func authorise(reason: String) async -> ParentAuthorisationResult
}
