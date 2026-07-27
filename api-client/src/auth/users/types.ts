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

export interface AuthUsersResponse {
  data: AuthUser[]
  meta: {
    cursor: number
    totalLength: number
  }
}

export interface CreateUserRequest {
  data: {
    username: string
    fullName: string
    password: string
    accountType: AuthUserAccountType
  }
}

export interface UpdateSelfRequest {
  data: {
    username?: string
    fullName?: string
    password?: string
  }
}
