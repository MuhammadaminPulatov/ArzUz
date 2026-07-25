import { put } from '@vercel/blob'
import { env } from '../config/env'

export interface UploadResult {
  url: string
  thumbnailUrl: string
}

export async function uploadPhoto(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<UploadResult> {
  if (!env.blobToken || env.blobToken === 'test') {
    const fake = `https://test-blob.vercel-storage.com/${Date.now()}-${filename}`
    return { url: fake, thumbnailUrl: fake }
  }

  const { url } = await put(`tickets/${Date.now()}-${filename}`, buffer, {
    access: 'public',
    contentType,
    token: env.blobToken,
  })

  return { url, thumbnailUrl: url }
}
