export interface ResponseToken {
  token: string
}

export type AuthorizationToken = ResponseToken
export type RegistrationToken = ResponseToken

export interface CreateRegistrationParams {
  subject: string
  agent: string
  agentId: string
}
