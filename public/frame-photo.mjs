export async function optimise(file) {
  if (file.size > 15 * 1024 * 1024) throw Error('Choose a photo under 15 MB.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw Error('Choose a JPG, PNG or WebP image.');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  try {
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } finally {
    bitmap.close();
  }

  let quality = .9;
  let result = canvas.toDataURL('image/jpeg', quality);
  while (result.length > 640000 && quality > .3) {
    quality -= .1;
    result = canvas.toDataURL('image/jpeg', quality);
  }
  if (result.length > 650000) throw Error('This photo is too complex. Please choose a smaller image.');
  return result;
}
