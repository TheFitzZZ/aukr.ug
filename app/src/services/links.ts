import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform } from 'react-native';

import { resolveSiteUrl, type Site } from '@aukrug/content';

import { Colors } from '@/constants/theme';
import { trackEvent } from '@/services/firebase';

async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Link konnte nicht geöffnet werden', url);
  }
}

/** Opens tel:/mailto:/app links externally and web pages in the in-app browser. */
export async function openLink(link: string, site: Site) {
  const url = resolveSiteUrl(link, site.websiteUrl);
  if (/^https?:\/\//.test(url) && !/^https:\/\/(wa\.me|www\.instagram\.com|maps\.app\.goo\.gl)\//.test(url)) {
    await WebBrowser.openBrowserAsync(url, {
      controlsColor: Colors.accent,
      toolbarColor: Colors.ink,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    return;
  }
  await openExternal(url);
}

export type ContactMethod = 'phone' | 'whatsapp' | 'email' | 'route' | 'instagram';

export function contact(method: ContactMethod, site: Site, emailSubject?: string) {
  trackEvent('contact', { method });
  switch (method) {
    case 'phone':
      return openExternal(site.phone.uri);
    case 'whatsapp':
      return openExternal(site.whatsappUrl);
    case 'email':
      return openExternal(`mailto:${site.email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}`);
    case 'instagram':
      return openExternal(site.instagramUrl);
    case 'route': {
      const { latitude, longitude } = site.coordinates;
      const label = encodeURIComponent(site.name);
      const native =
        Platform.OS === 'ios'
          ? `https://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`
          : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
      return Linking.openURL(native).catch(() => openExternal(site.mapsUrl));
    }
  }
}

export function formatAddress(site: Site) {
  return `${site.address.street}, ${site.address.postalCode} ${site.address.city}`;
}
