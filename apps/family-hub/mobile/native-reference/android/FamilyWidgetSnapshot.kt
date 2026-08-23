package com.arh.familylab.placeholder

data class FamilyWidgetSnapshot(
    val generatedAt: String,
    val householdId: String,
    val memberScope: String?,
    val pendingCount: Int,
    val attentionCount: Int,
    val confidence: String,
    val deepLink: String
)
