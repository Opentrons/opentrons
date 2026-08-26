export type AuthUserAccountType = 'admin' | 'user' | 'auditor' | 'service'

export type AuthUserResetPasswordReason =
  'FIRST_TIME_LOGIN' | 'PASSWORD_EXPIRED' | 'ADMIN_FORCED'

export interface AuthUser {
  username: string
  fullName: string
  accountType: AuthUserAccountType
  locked: boolean
  resetPassword: boolean
  resetPasswordReason?: AuthUserResetPasswordReason | null
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

export interface UserLoginStatus {
  resetPasswordReason?: AuthUserResetPasswordReason | null
}

export interface UserLoginStatusResponse {
  data: UserLoginStatus
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
    locked?: boolean
  }
}

export interface UpdateUserParams {
  username: string
  request: UpdateUserRequest
}
