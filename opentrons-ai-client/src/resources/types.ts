export interface ChatData {
  /** assistant: ChatGPT API, user: user */
  role: 'assistant' | 'user'
  /** content ChatGPT API return or user prompt */
  content: string
}
