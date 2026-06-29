import type {
  AccessControlAppSettingsData,
  AuthSettingsData,
} from '@opentrons/api-client'

export type AuthSettingFieldId = keyof AuthSettingsData

export type AppAccessControlSettingFieldId = keyof AccessControlAppSettingsData

export const AUTH_SERVER_SETTING_FIELD_IDS = {
  maxNumberOfLoginAttempts: true,
  passwordResetTime: true,
  passwordComplexityMinimumLength: true,
  passwordComplexitySpecialCharacters: true,
  idleLogout: true,
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: true,
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsWhenSendingProtocolToRobot: true,
  requireAdminCredsForSignoffProtocol: true,
} as const satisfies Record<AuthSettingFieldId, true>

export const ROBOT_SERVER_SETTING_FIELD_IDS = {
  requireSignoffForProtocolLog: true,
  requireLogsToBeSavedInApp: true,
  deleteOverMaxOnDiskProtocols: true,
} as const satisfies Record<AppAccessControlSettingFieldId, true>

export function isAuthServerSettingKey(key: string): key is AuthSettingFieldId {
  return key in AUTH_SERVER_SETTING_FIELD_IDS
}

export function isRobotServerSettingKey(
  key: string
): key is AppAccessControlSettingFieldId {
  return key in ROBOT_SERVER_SETTING_FIELD_IDS
}

/** Auth settings stored as numbers but edited as text inputs in the form. */
export const AUTH_INPUT_FIELD_IDS = {
  maxNumberOfLoginAttempts: true,
  passwordResetTime: true,
  passwordComplexityMinimumLength: true,
  idleLogout: true,
  minLengthOfReasonForInteraction: true,
} as const satisfies Partial<Record<AuthSettingFieldId, true>>

export const UI_ONLY_FIELD_IDS = [
  'passwordResetEnabled',
  'passwordComplexityEnabled',
] as const

export type UiSettingFieldId = (typeof UI_ONLY_FIELD_IDS)[number]

export type SettingFieldId =
  | AuthSettingFieldId
  | UiSettingFieldId
  | AppAccessControlSettingFieldId

export function isAuthInputFieldId(
  id: SettingFieldId
): id is keyof typeof AUTH_INPUT_FIELD_IDS {
  return id in AUTH_INPUT_FIELD_IDS
}

/** Field id exists only in the UI and has no server counterpart. */
export function isUiOnlyFieldId(id: SettingFieldId): id is UiSettingFieldId {
  return (UI_ONLY_FIELD_IDS as readonly string[]).includes(id)
}

export type FieldValues = Record<SettingFieldId, string | boolean>

/** Toggle metadata passed to settings helpers (not UI config). */
export interface ComplianceReadyToggleFieldDescriptor {
  id: SettingFieldId
  children?: SettingFieldId[]
}
