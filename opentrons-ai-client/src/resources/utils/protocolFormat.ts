import type { Chat, ProtocolFormat } from '../types'

/**
 * Automatically detects the protocol format based on message content and history
 * @param message - The current user message
 * @param history - Optional chat history
 * @returns ProtocolFormat - 'Protocol Designer' or 'Python'
 */
export const detectProtocolFormat = (
  message: string,
  history?: Chat[]
): ProtocolFormat => {
  // Check current message for Protocol Designer keywords
  if (
    message.length > 0 &&
    message.toLowerCase().includes('protocol designer')
  ) {
    return 'Protocol Designer'
  }

  // Check history for context
  if (history != null && history.length > 0) {
    for (const msg of history) {
      if (
        msg.role === 'user' &&
        typeof msg.content === 'string' &&
        msg.content.toLowerCase().includes('protocol designer')
      ) {
        return 'Protocol Designer'
      }
    }
  }

  return 'Python'
}
