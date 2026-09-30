export type Fragments = Record<string, string[]>;

export interface MarkerResult {
  html: string;
  replaced: string[];
  unknown: string[];
}

const MARKER_BLOCK =
  /^([ \t]*)(<!-- content:([a-z0-9-]+)(?:\s[^>]*?)? -->)\n[\s\S]*?^[ \t]*<!-- \/content:\3 -->$/gm;

/**
 * Replaces everything between `<!-- content:NAME … -->` and `<!-- /content:NAME -->`
 * with the generated fragment, indented like the opening marker.
 */
export function applyMarkers(html: string, fragments: Fragments): MarkerResult {
  const replaced: string[] = [];
  const unknown: string[] = [];
  const output = html.replace(MARKER_BLOCK, (block, indent: string, opening: string, name: string) => {
    const lines = fragments[name];
    if (!lines) {
      unknown.push(name);
      return block;
    }
    replaced.push(name);
    const body = lines.map((line) => (line ? `${indent}${line}` : '')).join('\n');
    return `${indent}${opening}\n${body ? `${body}\n` : ''}${indent}<!-- /content:${name} -->`;
  });
  return { html: output, replaced, unknown };
}
