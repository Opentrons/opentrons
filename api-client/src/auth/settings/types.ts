export interface AccessControlEnabledSettingsResponse {
  data: {
    accessControlEnabled: boolean
  }
}

export interface PatchAccessControlEnabledSettingsRequest {
  data: {
    accessControlEnabled?: true
  }
}

export interface AuthSettingsData {
  maxNumberOfLoginAttempts?: number | null
  passwordResetTime?: number | null
  passwordComplexityMinimumLength?: number | null
  passwordComplexitySpecialCharacters?: boolean | null
  idleLogout?: number | null
  requireAdminCredsWhenUpdatingRobotSoftware?: boolean | null
  requireAdminCredsWhenSendingProtocolToRobot?: boolean | null
  requireAdminCredsForSignoffProtocol?: boolean | null
}

export interface AuthSettingsResponse {
  data: AuthSettingsData
}

export interface PatchAuthSettingsRequest {
  data: Partial<AuthSettingsData>
}
