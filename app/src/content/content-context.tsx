import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { ContentBundle } from '@aukrug/content';

import { readJson, writeJson } from '@/services/storage';

import { parseRemoteBundle, snapshot } from './bundle';

const CACHE_FILE = 'content-cache.json';
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const TIMEOUT_MS = 12_000;

export const CONTENT_URL: string = Constants.expoConfig?.extra?.contentUrl ?? 'https://aukr.ug/content/bundle.json';

type Source = 'snapshot' | 'cache' | 'remote';

interface CachedContent {
  bundle: unknown;
  fetchedAt: string;
}

interface ContentState {
  bundle: ContentBundle;
  source: Source;
  fetchedAt?: string;
  refreshing: boolean;
  error?: 'offline' | 'invalid';
  updateRequired: boolean;
  refresh: (options?: { force?: boolean }) => Promise<void>;
}

const ContentContext = createContext<ContentState | null>(null);

function loadCache(): { bundle: ContentBundle; fetchedAt: string } | undefined {
  const cached = readJson(CACHE_FILE) as CachedContent | undefined;
  if (!cached) return undefined;
  const parsed = parseRemoteBundle(cached.bundle);
  return parsed.ok ? { bundle: parsed.bundle, fetchedAt: cached.fetchedAt } : undefined;
}

export async function downloadContent(fetchImpl: typeof fetch = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${CONTENT_URL}?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseRemoteBundle(await response.json());
  } finally {
    clearTimeout(timer);
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadCache());
  const [bundle, setBundle] = useState<ContentBundle>(initial?.bundle ?? snapshot);
  const [source, setSource] = useState<Source>(initial ? 'cache' : 'snapshot');
  const [fetchedAt, setFetchedAt] = useState(initial?.fetchedAt);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ContentState['error']>();
  const [updateRequired, setUpdateRequired] = useState(false);
  const lastAttempt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (inFlight.current) return inFlight.current;
    if (!force && Date.now() - lastAttempt.current < REFRESH_INTERVAL_MS) return;
    lastAttempt.current = Date.now();
    setRefreshing(true);
    inFlight.current = (async () => {
      try {
        const result = await downloadContent();
        if (result.ok) {
          const now = new Date().toISOString();
          setBundle(result.bundle);
          setSource('remote');
          setFetchedAt(now);
          setError(undefined);
          setUpdateRequired(false);
          writeJson(CACHE_FILE, { bundle: result.bundle, fetchedAt: now } satisfies CachedContent);
        } else {
          setUpdateRequired(result.reason === 'update-required');
          setError(result.reason === 'invalid' ? 'invalid' : undefined);
        }
      } catch {
        setError('offline');
      } finally {
        setRefreshing(false);
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    refresh({ force: true });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({ bundle, source, fetchedAt, refreshing, error, updateRequired, refresh }),
    [bundle, source, fetchedAt, refreshing, error, updateRequired, refresh],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentState {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used inside ContentProvider');
  return context;
}
