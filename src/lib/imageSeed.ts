const TARGET_WIDTH = 640;
const TARGET_HEIGHT = 360;
const MAX_RAW_JPEG_BYTES = 42_000;

export async function compressImageToWebRtcJpeg(imageUrl: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('无法加载着陆区引导图像。'));
    el.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_WIDTH;
  canvas.height = TARGET_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('浏览器 Canvas 2D 上下文不可用。');
  }

  ctx.drawImage(img, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

  const qualities = [0.68, 0.56, 0.44, 0.34, 0.25];
  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const rawBytes = Math.floor((base64.length * 3) / 4);
    if (rawBytes <= MAX_RAW_JPEG_BYTES) {
      return base64;
    }
  }

  const fallbackUrl = canvas.toDataURL('image/jpeg', 0.2);
  return fallbackUrl.replace(/^data:image\/jpeg;base64,/, '');
}
