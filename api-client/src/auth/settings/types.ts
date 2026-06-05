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
    maxNumberOfLoginAttempts: number
    passwordResetTime: number
    passwordComplexityMinimumLength: number
    passwordComplexitySpecialCharacters: boolean
    idleLogout: number
    requireReasonForInteraction: boolean
    minLengthOfReasonForInteraction: number
    requireAdminCredsWhenUpdatingRobotSoftware: boolean
    requireAdminCredsWhenSendingProtocolToRobot: boolean
    requireAdminCredsForSignoffProtocol: boolean
  }
}
