import { v4 as uuidv4 } from 'uuid'

import { getFileType } from './fileUtils'

import type { ChatData, ProtocolFormat } from '/ai-client/resources/types'

export const createUserInput = (
  requestId: string,
  protocolFormat: ProtocolFormat,
  validatedFiles: File[],
  watchUserPrompt: string
): ChatData => {
  return {
    requestId,
    role: 'user',
    reply: watchUserPrompt,
    protocolFormat: protocolFormat,
    attachments:
      validatedFiles.length > 0
        ? validatedFiles.map(file => {
            const fileType = getFileType(file)
            if (fileType === null) {
              throw new Error(
                `Unexpected: validated file has no type: ${file.name}`
              )
            }
            return {
              id: uuidv4(),
              name: file.name,
              type: fileType,
              content: file,
            }
          })
        : undefined,
  }
}
