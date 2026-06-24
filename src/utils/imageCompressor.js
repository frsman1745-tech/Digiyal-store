import imageCompression from 'browser-image-compression';

export async function compressImage(file, onProgress) {
  const options = {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8,
    onProgress,
  };

  const compressedFile = await imageCompression(file, options);

  const sizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
  const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);

  return {
    file: compressedFile,
    dataUrl: await imageCompression.getDataUrlFromFile(compressedFile),
    sizeMB: parseFloat(sizeMB),
    originalSizeMB: parseFloat(originalSizeMB),
    name: compressedFile.name || file.name.replace(/\.[^.]+$/, '.webp'),
  };
}
