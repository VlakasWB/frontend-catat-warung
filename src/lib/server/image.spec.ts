import { describe, it, expect } from 'vitest';
import { preprocessImage } from './image';
import sharp from 'sharp';

// Tiny 2x2 png
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAF0lEQVQImWP8z/D/PwMDAwMjiAIAN0YC/LZTSdgAAAAASUVORK5CYII=';

describe('preprocessImage', () => {
  it('outputs a jpeg buffer', async () => {
    const buf = Buffer.from(PNG_BASE64, 'base64');
    const out = await preprocessImage(buf);
    const meta = await sharp(out).metadata();
    expect(meta.format).toBe('jpeg');
  });
});
