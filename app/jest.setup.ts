// In-memory replacement for the native file system used by content cache and settings.
jest.mock('expo-file-system', () => {
  const store = new Map<string, string>();
  class File {
    uri: string;
    constructor(directory: string, name: string) {
      this.uri = `${directory}/${name}`;
    }
    get exists() {
      return store.has(this.uri);
    }
    create() {
      store.set(this.uri, '');
    }
    textSync() {
      return store.get(this.uri) ?? '';
    }
    write(text: string) {
      store.set(this.uri, text);
    }
  }
  return { File, Paths: { document: 'documents' }, __store: store };
});

require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
