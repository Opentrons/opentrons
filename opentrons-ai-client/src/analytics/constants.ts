export const ANALYTICS = {
  // App lifecycle
  APP_OPEN: 'appOpen',

  // Authentication
  USER_LOGIN: 'user-login',
  USER_LOGOUT: 'user-logout',

  // Chat interactions
  CHAT_SUBMITTED: 'chat-submitted',
  SUBMIT_PROMPT: 'submit-prompt',

  // Protocol actions
  GENERATED_PROTOCOL: 'generated-protocol',
  REGENERATE_PROTOCOL: 'regenerate-protocol',
  DOWNLOAD_PROTOCOL: 'download-protocol',
  COPY_PROTOCOL: 'copy-protocol',

  // Navigation
  CREATE_NEW_PROTOCOL: 'create-new-protocol',
  UPDATE_PROTOCOL: 'update-protocol',
  GO_TO_CHAT: 'go-to-chat',

  // Feedback
  FEEDBACK_SENT: 'feedback-sent',
} as const

export type AnalyticsTrackEvent = typeof ANALYTICS[keyof typeof ANALYTICS]
