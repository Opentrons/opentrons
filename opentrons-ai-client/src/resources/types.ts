export interface ChatData {
  /** assistant: ChatGPT API, user: user */
  role: 'assistant' | 'user'
  /** content ChatGPT API return or user prompt */
  reply: string
  /** for testing purpose will be removed and this is not used in the app */
  fake?: boolean
}
