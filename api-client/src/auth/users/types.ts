export type AuthUserAccountType = 'admin' | 'user' | 'auditor' | 'service'

export interface AuthUser {
  userName: string
  fullName: string
  accountType: AuthUserAccountType
  scopes: string[]
  locked: boolean
  resetPassword: boolean
}

export interface AuthUserResponse {
  data: AuthUser
}
