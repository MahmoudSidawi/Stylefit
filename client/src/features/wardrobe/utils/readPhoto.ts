export async function readPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Choose a JPG, PNG, or WebP photo.')
  if (file.size > 2 * 1024 * 1024)
    throw new Error('Choose a photo smaller than 2 MB.')
  if (!file.size) throw new Error('This photo is empty. Choose another file.')
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('The photo could not be read.'))
    reader.onerror = () =>
      reject(new Error('The photo could not be read. Try another file.'))
    reader.readAsDataURL(file)
  })
  const image = new Image()
  image.src = data
  try {
    await image.decode()
  } catch {
    throw new Error(
      'This file is not a readable photo. Choose a different image.',
    )
  }
  if (image.naturalWidth > 12000 || image.naturalHeight > 12000)
    throw new Error(
      'This photo is too large. Choose an image up to 12,000 pixels per side.',
    )
  return data
}
