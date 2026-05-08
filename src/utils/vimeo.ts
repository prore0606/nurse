/**
 * Vimeo video ID + privacy hash (unlisted videos) 처리.
 *
 * 반환값 형식:
 * - 공개 영상: "12345"
 * - 비공개(unlisted) 영상: "12345/abcdef"  (privacy hash 포함)
 *
 * oEmbed API와 player URL 모두 이 형식 그대로 받을 수 있다.
 */
export function extractVimeoId(input: string): string | null {
  const trimmed = input.trim();

  // 이미 "12345" 또는 "12345/abc" 형식
  if (/^\d+(\/[a-zA-Z0-9]+)?$/.test(trimmed)) return trimmed;

  const patterns = [
    // https://vimeo.com/12345 or https://vimeo.com/12345/abcdef
    /vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/,
    // https://player.vimeo.com/video/12345?h=abcdef
    /player\.vimeo\.com\/video\/(\d+)(?:\?h=([a-zA-Z0-9]+))?/,
    // https://vimeo.com/channels/foo/12345/abcdef
    /vimeo\.com\/channels\/[\w-]+\/(\d+)(?:\/([a-zA-Z0-9]+))?/,
    // https://vimeo.com/groups/foo/videos/12345/abcdef
    /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)(?:\/([a-zA-Z0-9]+))?/,
  ];

  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match) {
      const id = match[1];
      const hash = match[2];
      return hash ? `${id}/${hash}` : id;
    }
  }
  return null;
}

/** videoId("12345" 또는 "12345/abc") → 표준 Vimeo URL */
export function buildVimeoUrl(videoId: string): string {
  return `https://vimeo.com/${videoId}`;
}

/** videoId → player.vimeo.com 임베드 URL (해시는 ?h= 쿼리로 변환) */
export function buildVimeoEmbedUrl(
  videoId: string,
  extraParams: Record<string, string> = {},
): string {
  const [id, hash] = videoId.split("/");
  const params = new URLSearchParams(extraParams);
  if (hash) params.set("h", hash);
  const query = params.toString();
  return `https://player.vimeo.com/video/${id}${query ? `?${query}` : ""}`;
}
