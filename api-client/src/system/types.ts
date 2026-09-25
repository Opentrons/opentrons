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

export interface SystemTimeData {
  id: 'time'
  systemTime: string
}

export interface SystemTimeResponse {
  data: SystemTimeData
  links?: { self?: { href: string } }
}

export interface SystemTimeRequest {
  data: {
    systemTime: string
  }
}
