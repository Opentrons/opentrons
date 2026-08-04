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

export interface TemporaryPasswordAuthUser extends AuthUser {
  temporaryPassword?: string
}

export interface TemporaryPasswordAuthUserResponse {
  data: TemporaryPasswordAuthUser
}

export type CreateUserResponse = TemporaryPasswordAuthUserResponse

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
    password?: string
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

export interface UpdateUserRequest {
  data: {
    username?: string
    fullName?: string
    accountType?: AuthUserAccountType
  }
}

export interface UpdateUserParams {
  username: string
  request: UpdateUserRequest
}
