import sharp from 'sharp';

export const preprocessImage = async (input: Buffer): Promise<Buffer> => {
  const image = sharp(input, { failOnError: false });
  const metadata = await image.metadata();

  if (metadata.width && metadata.width > 1280) {
    return image.resize({ width: 1280 }).jpeg({ quality: 85 }).toBuffer();
  }

  return image.jpeg({ quality: 90 }).toBuffer();
};
