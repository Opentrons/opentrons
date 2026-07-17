export type AuthUserAccountType = 'admin' | 'user' | 'auditor' | 'service'

export interface AuthUser {
  username: string
  fullName: string
  accountType: AuthUserAccountType
  locked: boolean
  resetPassword: boolean
}

export interface AuthUserResponse {
  data: AuthUser
}

export interface UpdateSelfRequest {
  data: {
    username?: string
    fullName?: string
    password?: string
  }
}
