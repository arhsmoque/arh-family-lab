package com.arh.familylab.placeholder

/**
 * Reference shape only.
 * Generated project should implement CoroutineWorker and drain the persisted operation log as unique work.
 */
class FamilySyncWorkerContract {
    enum class Result { SUCCESS, RETRY, AUTHENTICATION_REQUIRED, CONFLICT }
}
