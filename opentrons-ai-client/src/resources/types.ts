/** assistant: ChatGPT API, user: user */
type Role = 'assistant' | 'user'

export interface ChatData {
  /** assistant: ChatGPT API, user: user */
  role: Role
  /** content ChatGPT API return or user prompt */
  reply: string
  /** for testing purpose will be removed and this is not used in the app */
  fake?: boolean
}

export interface Chat {
  /** assistant: ChatGPT API, user: user */
  role: Role
  /** content ChatGPT API return or user prompt */
  content: string
}
