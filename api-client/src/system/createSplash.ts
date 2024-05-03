import { POST, request } from '../request'
import { sanitizeFileName } from './utils'
import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'

export function createSplash(
  config: HostConfig,
  file: File
): ResponsePromise<void> {
  // sanitize file name to ensure no spaces or special characters
  const newFileName = sanitizeFileName(file.name)
  const renamedFile = new File([file], newFileName, {
    type: 'image/png',
  })

  const formData = new FormData()
  formData.append('file', renamedFile)

  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  return request<void, FormData>(
    POST,
    '/system/oem_mode/upload_splash',
    formData,
    config
  )
}
