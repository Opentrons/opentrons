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

export class AuthSettingsData {
  maxNumberOfLoginAttempts?: number | null
  passwordResetTime?: number | null
  passwordComplexityMinimumLength?: number | null
  passwordComplexitySpecialCharacters?: boolean | null
  idleLogout?: number | null
  requireReasonForInteraction?: boolean | null
  minLengthOfReasonForInteraction?: number | null
  requireAdminCredsWhenUpdatingRobotSoftware?: boolean | null
  requireAdminCredsWhenSendingProtocolToRobot?: boolean | null
  requireAdminCredsForSignoffProtocol?: boolean | null

  static hasSettingKey(key: string): key is keyof AuthSettingsData {
    return key in new AuthSettingsData()
  }
}

export class AuthSettingsResponse {
  data!: AuthSettingsData
}

export interface PatchAuthSettingsRequest {
  data: Partial<AuthSettingsData>
}
