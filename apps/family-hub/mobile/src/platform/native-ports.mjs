export class UnsupportedCapabilityError extends Error {
  constructor(capability) {
    super(`${capability} is not available on this platform.`);
    this.name = 'UnsupportedCapabilityError';
  }
}

export const nativePorts = {
  async authoriseParent() { throw new UnsupportedCapabilityError('parent re-authorisation'); },
  async requestQueueFlush() { window.dispatchEvent(new CustomEvent('familylab:request-sync')); },
  async refreshWidget() { throw new UnsupportedCapabilityError('widget refresh'); }
};
