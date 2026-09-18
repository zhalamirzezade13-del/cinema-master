export function youtubeVideoId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    let id = '';
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.slice(1);
    } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' ||
               host === 'youtube-nocookie.com' || host === 'www.youtube-nocookie.com') {
      if (url.pathname === '/watch') id = url.searchParams.get('v') ?? '';
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] ?? '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
