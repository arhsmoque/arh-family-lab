package com.arh.familylab.placeholder

/** Reference boundary only; wire through BiometricPrompt after the final package is known. */
interface ParentAuthorisation {
    suspend fun authorise(reason: String): AuthorisationResult
}

data class AuthorisationResult(
    val authorised: Boolean,
    val method: String
)
