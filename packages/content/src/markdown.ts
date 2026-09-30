/**
 * Minimal Markdown subset used for app pages:
 * `#`–`###` headings, paragraphs (single newlines are line breaks), `-` lists,
 * `**bold**`, `[text](url)` and images `![alt](src)`; consecutive image lines form a gallery.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'link'; text: string; url: string };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; items: Inline[][] }
  | { type: 'gallery'; images: { src: string; alt: string }[] };

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

export function parseInline(source: string): Inline[] {
  const result: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) result.push({ type: 'text', text: source.slice(last, index) });
    if (match[1] !== undefined) result.push({ type: 'bold', text: match[1] });
    else result.push({ type: 'link', text: match[2]!, url: match[3]! });
    last = index + match[0].length;
  }
  if (last < source.length) result.push({ type: 'text', text: source.slice(last) });
  return result;
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let images: { src: string; alt: string }[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', content: parseInline(paragraph.join('\n')) });
    if (list.length) blocks.push({ type: 'list', items: list.map(parseInline) });
    if (images.length) blocks.push({ type: 'gallery', images });
    paragraph = [];
    list = [];
    images = [];
  };

  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: 'heading', level: heading[1]!.length as 1 | 2 | 3, text: heading[2]! });
      continue;
    }
    const image = IMAGE_LINE.exec(line);
    if (image) {
      if (paragraph.length || list.length) flush();
      images.push({ alt: image[1]!, src: image[2]! });
      continue;
    }
    const item = /^[-*]\s+(.+)$/.exec(line);
    if (item) {
      if (paragraph.length || images.length) flush();
      list.push(item[1]!);
      continue;
    }
    if (list.length || images.length) flush();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Title from the first level-1 heading. */
export function markdownTitle(source: string): string | undefined {
  return /^#\s+(.+)$/m.exec(source)?.[1]?.trim();
}
