import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { registerDeepLinkRouting } from './runtime/deep-links.mjs';
import { installLifecycleBridge } from './runtime/lifecycle.mjs';
import { capabilityRegistry } from './runtime/capability-registry.mjs';

export async function bootFamilyLabMobile() {
  installLifecycleBridge(App);
  registerDeepLinkRouting(App);
  const network = await Network.getStatus();
  window.dispatchEvent(new CustomEvent('familylab:native-ready', {
    detail: { platform: 'capacitor', network, capabilities: capabilityRegistry }
  }));
}

bootFamilyLabMobile().catch((error) => {
  console.error('Family Lab mobile bootstrap failed', error);
  window.dispatchEvent(new CustomEvent('familylab:native-failed', { detail: { message: String(error) } }));
});
