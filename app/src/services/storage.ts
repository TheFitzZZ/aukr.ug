import { File, Paths } from 'expo-file-system';

/** Reads a JSON document from the app's private document directory. */
export function readJson(name: string): unknown {
  try {
    const file = new File(Paths.document, name);
    return file.exists ? JSON.parse(file.textSync()) : undefined;
  } catch (error) {
    console.warn(`Konnte ${name} nicht lesen`, error);
    return undefined;
  }
}

export function writeJson(name: string, value: unknown): void {
  try {
    const file = new File(Paths.document, name);
    if (!file.exists) file.create();
    file.write(JSON.stringify(value));
  } catch (error) {
    console.warn(`Konnte ${name} nicht speichern`, error);
  }
}
