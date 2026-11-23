import { Image } from 'react-native-compressor';

/** Compresses a local image URI using WhatsApp-style auto compression, falling back to the original URI on failure. */
export async function compressImageUri(uri: string): Promise<string> {
  try {
    return await Image.compress(uri, {
      compressionMethod: 'auto',
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
    });
  } catch {
    return uri;
  }
}

/** Compresses multiple local image URIs in parallel. */
export async function compressImageUris(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map(compressImageUri));
}
