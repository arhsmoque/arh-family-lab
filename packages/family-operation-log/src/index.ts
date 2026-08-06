export type OperationAction = 'create' | 'update' | 'delete' | 'complete' | 'restore';
export type OperationStatus = 'pending' | 'sending' | 'acknowledged' | 'conflicted' | 'failed';

export interface FamilyOperation<T = unknown> {
  operationId: string;
  objectType: string;
  objectId: string;
  action: OperationAction;
  baseVersion: number | null;
  localTimestamp: number;
  actorId: string;
  deviceId: string;
  payload: T;
  status: OperationStatus;
  retryCount: number;
  tombstone: boolean;
}

export function createOperation<T>(input: Omit<FamilyOperation<T>, 'operationId' | 'status' | 'retryCount'>): FamilyOperation<T> {
  return {
    ...input,
    operationId: crypto.randomUUID(),
    status: 'pending',
    retryCount: 0
  };
}
