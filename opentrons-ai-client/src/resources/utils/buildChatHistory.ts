import { parseProtocolContent } from './protocolUtils'

import type {
  Chat,
  ChatMessage,
  ProtocolFormat,
} from '/ai-client/resources/types'

export const buildChatHistory = (
  chatHistory: Chat[],
  protocolFormat: ProtocolFormat
): ChatMessage[] => {
  return chatHistory.map(msg => {
    const baseMessage: ChatMessage = {
      role: msg.role,
      content: msg.content,
    }

    // Extract file metadata from attachments for JSON serialization
    if (msg.attachments && msg.attachments.length > 0) {
      baseMessage.fileMetadata = msg.attachments.map(att => ({
        id: att.id,
        name: att.name,
        type: att.type,
      }))
    }

    // Handle Protocol Designer content if needed
    if (protocolFormat === 'Protocol Designer' && msg.protocolContent != null) {
      const rawPdJson = parseProtocolContent(msg.protocolContent)

      // Extract all properties except labwareDefinitions using destructuring
      const { labwareDefinitions, ...pdWithoutLabwareDefs } = rawPdJson

      baseMessage.content = `${msg.content}\n\n${JSON.stringify(
        pdWithoutLabwareDefs
      )}`
    }

    return baseMessage
  })
}
