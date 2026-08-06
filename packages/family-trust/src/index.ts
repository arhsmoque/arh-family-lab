export type SyncState =
  | 'local_clean'
  | 'saved_local'
  | 'syncing'
  | 'synced_remote'
  | 'offline_pending'
  | 'authentication_required'
  | 'conflict'
  | 'rejected';

export const syncStateMeaning: Record<SyncState, { remoteConfirmed: boolean; userActionRequired: boolean }> = {
  local_clean: { remoteConfirmed: false, userActionRequired: false },
  saved_local: { remoteConfirmed: false, userActionRequired: false },
  syncing: { remoteConfirmed: false, userActionRequired: false },
  synced_remote: { remoteConfirmed: true, userActionRequired: false },
  offline_pending: { remoteConfirmed: false, userActionRequired: false },
  authentication_required: { remoteConfirmed: false, userActionRequired: true },
  conflict: { remoteConfirmed: false, userActionRequired: true },
  rejected: { remoteConfirmed: false, userActionRequired: true }
};
