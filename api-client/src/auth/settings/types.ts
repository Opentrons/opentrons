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

export interface AuthSettingsResponse {
  data: {
    maxNumberOfLoginAttempts: number | null
    passwordResetTime: number | null
    passwordComplexityMinimumLength: number | null
    passwordComplexitySpecialCharacters: boolean
    idleLogout: number
    requireReasonForInteraction: boolean
    minLengthOfReasonForInteraction: number | null
    requireAdminCredsWhenUpdatingRobotSoftware: boolean
    requireAdminCredsWhenSendingProtocolToRobot: boolean
    requireAdminCredsForSignoffProtocol: boolean
  }
}
