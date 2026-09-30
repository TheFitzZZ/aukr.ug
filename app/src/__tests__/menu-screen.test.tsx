import { fireEvent, render, screen } from '@testing-library/react-native';

import { ContentProvider } from '@/content/content-context';

import MenuScreen from '@/app/(tabs)/menu';

describe('MenuScreen', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
  });

  it('shows the structured menu and filters it', async () => {
    render(
      <ContentProvider>
        <MenuScreen />
      </ContentProvider>,
    );

    expect(await screen.findByText('Unsere Karte')).toBeOnTheScreen();
    expect(screen.getByText('Currywurst')).toBeOnTheScreen();
    expect(screen.getByText('+ Champignonsauce')).toBeOnTheScreen();

    fireEvent.changeText(screen.getByLabelText('Speisekarte durchsuchen'), 'garnelen');
    expect(screen.getByText('Garnelen')).toBeOnTheScreen();
    expect(screen.getByText('Kürbissuppe')).toBeOnTheScreen();
    expect(screen.queryByText('Currywurst')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Speisekarte durchsuchen'), 'xyz');
    expect(screen.getByText('Kein Gericht gefunden.')).toBeOnTheScreen();
  });
});
