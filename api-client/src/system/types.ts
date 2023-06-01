export interface ResponseToken {
  token: string
}

export type AuthorizationToken = ResponseToken
export type RegistrationToken = ResponseToken

export interface Registrant {
  subject: string
  agent: string
  agentId: string
}

export type CreateRegistrationParams = Registrant

export interface ActiveConnections {
  connections: Registrant[]
}
