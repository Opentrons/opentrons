import type {
  Chat,
  ChatMessage,
  ProtocolFormat,
} from '/ai-client/resources/types'

export const buildMultipartFormData = (
  completeHistory: ChatMessage[],
  validatedFiles: File[],
  protocolFormat: ProtocolFormat,
  watchUserPrompt: string,
  chatHistory: Chat[]
): FormData => {
  const formData = new FormData()
  formData.append('message', watchUserPrompt)
  formData.append('history', JSON.stringify(completeHistory))
  formData.append('fake', 'false')
  formData.append('protocol_format', protocolFormat)

  // Collect and add files from chat history with message index
  completeHistory.forEach((msg, messageIndex) => {
    if (msg.role === 'user' && msg.fileMetadata) {
      msg.fileMetadata.forEach(att => {
        // Get the File object from the original chat history
        const originalMsg = chatHistory[messageIndex]
        if (originalMsg?.attachments) {
          const originalAtt = originalMsg.attachments.find(
            attachment => attachment.name === att.name
          )
          if (originalAtt?.content) {
            // Use message index in filename for backend association
            const fileKey = `msg${messageIndex}_${att.name}`
            formData.append('files', originalAtt.content, fileKey)
          }
        }
      })
    }
  })

  // Add current message files (they belong to the next message index)
  const currentMessageIndex = completeHistory.length
  validatedFiles.forEach(file => {
    const fileKey = `msg${currentMessageIndex}_${file.name}`
    formData.append('files', file, fileKey)
  })

  return formData
}
