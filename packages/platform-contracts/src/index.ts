export interface ParentAuthorisationPort {
  isAvailable(): Promise<boolean>;
  authorise(reasonCopyId: string): Promise<{
    authorised: boolean;
    method: 'biometric' | 'device_credential' | 'app_pin' | 'account_reauthentication';
  }>;
}

export interface ReminderPort {
  requestPermission(): Promise<'granted' | 'denied' | 'not_supported'>;
  schedule(request: { id: number; titleCopyId: string; bodyCopyId: string; at: string; deepLink: string }): Promise<void>;
  cancel(id: number): Promise<void>;
}

export interface BackgroundSyncPort {
  requestFlush(reason: 'foreground' | 'network_restored' | 'scheduled'): Promise<'accepted' | 'unavailable'>;
}

export interface WidgetRefreshPort {
  refreshFamilySummary(): Promise<'refreshed' | 'unavailable'>;
}
