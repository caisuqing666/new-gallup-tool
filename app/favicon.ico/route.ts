const ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAFv6ZJkAAAAASUVORK5CYII=';

export async function GET() {
  const png = Buffer.from(ICON_PNG_BASE64, 'base64');

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
