/** Vimeo URL에서 ID 추출 */
export function extractVimeoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match) return match[1];
  }
  return null;
}

/** Vimeo ID → 전체 URL */
export function buildVimeoUrl(vimeoId: string): string {
  return `https://vimeo.com/${vimeoId}`;
}
