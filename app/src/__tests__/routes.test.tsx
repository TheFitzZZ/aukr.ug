import { act, renderRouter, screen, testRouter } from 'expo-router/testing-library';

const APP_DIR = './src/app';

function fileStore(): Map<string, string> {
  return require('expo-file-system').__store;
}

function seedSettings(settings: Record<string, unknown>) {
  fileStore().set('documents/settings.json', JSON.stringify(settings));
}

beforeEach(() => {
  fileStore().clear();
  globalThis.fetch = jest.fn(async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  jest.useFakeTimers({ now: new Date('2026-10-09T18:00:00Z'), doNotFake: ['nextTick', 'setImmediate'] });
});

afterEach(() => {
  jest.useRealTimers();
});

async function open(initialUrl: string) {
  seedSettings({ onboardingDone: true });
  renderRouter(APP_DIR, { initialUrl });
  await act(async () => {});
}

describe('app routes', () => {
  it('shows onboarding on first launch', async () => {
    renderRouter(APP_DIR, { initialUrl: '/' });
    await act(async () => {});
    expect(screen).toHavePathname('/welcome');
    expect(screen.getByText('Schön, dass Sie da sind!')).toBeOnTheScreen();
  });

  it('renders the start screen with live opening status', async () => {
    await open('/');
    expect(screen).toHavePathname('/');
    expect(screen.getByText('Jetzt geöffnet')).toBeOnTheScreen();
    expect(screen.getByText('bis 22:00 Uhr')).toBeOnTheScreen();
    expect(screen.getByLabelText('Schnitzelbuffet im Aukrug, Sa, 10. Okt. · 18:30 Uhr')).toBeOnTheScreen();
  });

  it('lists events and offers', async () => {
    await open('/events');
    expect(screen.getByText('Kommende Veranstaltungen')).toBeOnTheScreen();
    expect(screen.getByLabelText('Die Comedy Magic Dinner Show!, Sa, 16. Jan. · 19:00 Uhr')).toBeOnTheScreen();
    expect(screen.getByText('Aktuelle Angebote')).toBeOnTheScreen();
  });

  it('opens event details from a notification deep link', async () => {
    await open('/events/schnitzelbuffet');
    expect(screen.getByText('Schnitzelbuffet im Aukrug')).toBeOnTheScreen();
    expect(screen.getByText('Samstag, 10.10.2026')).toBeOnTheScreen();
    expect(screen.getByText('Jetzt per E-Mail reservieren')).toBeOnTheScreen();
    expect(screen.getByText('In den Kalender eintragen')).toBeOnTheScreen();
    act(() => testRouter.back());
    expect(screen).toHavePathname('/');
  });

  it('handles removed events gracefully', async () => {
    await open('/events/gibt-es-nicht');
    expect(screen.getByText('Diese Veranstaltung ist nicht mehr verfügbar.')).toBeOnTheScreen();
  });

  it('shows opening hours and contact details', async () => {
    await open('/hours');
    expect(screen.getByText('Die nächsten 7 Tage')).toBeOnTheScreen();
    expect(screen.getByText('Dorfstraße 2')).toBeOnTheScreen();
  });

  it('shows the info tab and content pages', async () => {
    await open('/info');
    expect(screen.getByText('Biergarten & Räumlichkeiten')).toBeOnTheScreen();
    await open('/pages/impressum');
    expect(screen.getByText('Angaben gemäß § 5 DDG')).toBeOnTheScreen();
  });

  it('shows the settings screen', async () => {
    await open('/settings');
    expect(screen.getByText('Benachrichtigungen sind in dieser App-Version nicht verfügbar.')).toBeOnTheScreen();
    expect(screen.getByText('Nutzungsstatistik erlauben')).toBeOnTheScreen();
  });

  it('shows the calendar poster', async () => {
    await open('/calendar');
    expect(screen.getByText('Veranstaltungskalender 2026')).toBeOnTheScreen();
  });
});
