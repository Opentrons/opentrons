export const AUTH_SERVER_SETTING_FIELD_IDS = {
  maxNumberOfLoginAttempts: true,
  passwordResetTime: true,
  passwordComplexityMinimumLength: true,
  passwordComplexitySpecialCharacters: true,
  idleLogout: true,
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsWhenSendingProtocolToRobot: true,
  requireAdminCredsForSignoffProtocol: true,
} as const

export type AuthSettingFieldId = keyof typeof AUTH_SERVER_SETTING_FIELD_IDS

export const ROBOT_SERVER_SETTING_FIELD_IDS = {
  requireSignoffForProtocolLog: true,
  requireLogsToBeSavedInApp: true,
  deleteOverMaxOnDiskProtocols: true,
} as const

export type RobotServerSettingFieldId =
  keyof typeof ROBOT_SERVER_SETTING_FIELD_IDS

export const AUDIT_SERVER_SETTING_FIELD_IDS = {
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: true,
} as const
export type AuditServerSettingFieldId =
  keyof typeof AUDIT_SERVER_SETTING_FIELD_IDS

export function isAuthServerSettingKey(key: string): key is AuthSettingFieldId {
  return key in AUTH_SERVER_SETTING_FIELD_IDS
}

export function isRobotServerSettingKey(
  key: string
): key is RobotServerSettingFieldId {
  return key in ROBOT_SERVER_SETTING_FIELD_IDS
}

export function isAuditServerSettingKey(
  key: string
): key is AuditServerSettingFieldId {
  return key in AUDIT_SERVER_SETTING_FIELD_IDS
}

/** Audit settings stored as numbers but edited as text inputs in the form. */
export const AUDIT_INPUT_FIELD_IDS = {
  minLengthOfReasonForInteraction: true,
} as const satisfies Partial<Record<AuditServerSettingFieldId, true>>

/** Auth settings stored as numbers but edited as text inputs in the form. */
export const AUTH_INPUT_FIELD_IDS = {
  maxNumberOfLoginAttempts: true,
  passwordResetTime: true,
  passwordComplexityMinimumLength: true,
  idleLogout: true,
} as const satisfies Partial<Record<AuthSettingFieldId, true>>

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
] as const

export type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

export type SettingFieldId =
  | AuthSettingFieldId
  | UiSettingFieldId
  | RobotServerSettingFieldId
  | AuditServerSettingFieldId

export function isAuthInputFieldId(
  id: SettingFieldId
): id is keyof typeof AUTH_INPUT_FIELD_IDS {
  return id in AUTH_INPUT_FIELD_IDS
}

export function isAuditInputFieldId(
  id: SettingFieldId
): id is keyof typeof AUDIT_INPUT_FIELD_IDS {
  return id in AUDIT_INPUT_FIELD_IDS
}

export function isForceTextInputFieldId(
  id: SettingFieldId
): id is
  keyof typeof AUTH_INPUT_FIELD_IDS | keyof typeof AUDIT_INPUT_FIELD_IDS {
  return isAuthInputFieldId(id) || isAuditInputFieldId(id)
}

/** Field id exists only in the UI and has no server counterpart. */
export function isUiOnlyFieldId(id: SettingFieldId): id is UiSettingFieldId {
  return (UI_ONLY_FIELD_IDS as readonly string[]).includes(id)
}

export type FieldValues = Record<SettingFieldId, string | boolean>
