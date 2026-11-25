import {
  AUDIT_SERVER_SETTING_FIELD_IDS,
  AUTH_SERVER_SETTING_FIELD_IDS,
  ROBOT_SERVER_SETTING_FIELD_IDS,
} from './complianceReadySettingsTypes'

import type {
  AuditSettingsData,
  AuthSettingsData,
  PatchAuditSettingsRequest,
  PatchAuthSettingsRequest,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type {
  AuditServerSettingFieldId,
  AuthSettingFieldId,
  FieldValues,
  RobotServerSettingFieldId,
} from './complianceReadySettingsTypes'

export const SECONDS_PER_MINUTE = 60
export const SECONDS_PER_DAY = 24 * 60 * 60

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsData
): number | boolean | null {
  switch (key) {
    case 'idleLogout':
      return authSettings.idleLogout != null
        ? Math.round(authSettings.idleLogout / SECONDS_PER_MINUTE)
        : null
    case 'passwordResetTime':
      return authSettings.passwordResetTime != null
        ? Math.round(authSettings.passwordResetTime / SECONDS_PER_DAY)
        : null
    default: {
      const value = authSettings[key]
      return value ?? null
    }
  }
}

function getAuditSettingFieldValue(
  key: AuditServerSettingFieldId,
  auditSettings: AuditSettingsData
): number | boolean | null {
  switch (key) {
    default: {
      const value = auditSettings[key]
      return value ?? null
    }
  }
}

/** Map auth and robot-server access-control settings responses to form field values. */
export function getFieldValuesFromSettings(
  authSettings?: AuthSettingsData,
  robotServerAccessControlSettings?: RobotServerAccessControlSettingsData,
  auditSettings?: AuditSettingsData
): FieldValues {
  const authSettingsData = authSettings ?? {}
  const auditSettingsData = auditSettings ?? {}
  const robotServerAccessControlSettingsData =
    robotServerAccessControlSettings ?? {}

  const authFieldValues = (
    Object.keys(AUTH_SERVER_SETTING_FIELD_IDS) as AuthSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AuthSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: getAuthSettingFieldValue(key, authSettingsData),
    }),
    {}
  )

  const auditFieldValues = (
    Object.keys(AUDIT_SERVER_SETTING_FIELD_IDS) as AuditServerSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, AuditServerSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: getAuditSettingFieldValue(key, auditSettingsData),
    }),
    {}
  )

  const robotFieldValues = (
    Object.keys(ROBOT_SERVER_SETTING_FIELD_IDS) as RobotServerSettingFieldId[]
  ).reduce<Partial<Pick<FieldValues, RobotServerSettingFieldId>>>(
    (acc, key) => ({
      ...acc,
      [key]: robotServerAccessControlSettingsData[key] ?? false,
    }),
    {}
  )

  return {
    ...(authFieldValues as Pick<FieldValues, AuthSettingFieldId>),
    ...(auditFieldValues as Pick<FieldValues, AuditServerSettingFieldId>),
    ...(robotFieldValues as Pick<FieldValues, RobotServerSettingFieldId>),
    passwordResetEnabled: Boolean(authSettingsData.passwordResetTime),
    passwordComplexityEnabled:
      Boolean(authSettingsData.passwordComplexityMinimumLength) ||
      Boolean(authSettingsData.passwordComplexitySpecialCharacters),
  }
}

/** Auth-server patch for an input value, if it should be persisted. */
export function getInputPatch(
  id: AuthSettingFieldId,
  value: number
): PatchAuthSettingsRequest | null {
  switch (id) {
    case 'maxNumberOfLoginAttempts':
      return {
        data: { maxNumberOfLoginAttempts: value },
      }
    case 'idleLogout':
      return { data: { idleLogout: value * SECONDS_PER_MINUTE } }
    case 'passwordResetTime':
      return { data: { passwordResetTime: value * SECONDS_PER_DAY } }
    case 'passwordComplexityMinimumLength':
      return { data: { passwordComplexityMinimumLength: value } }
    default:
      return null
  }
}

export function getAuditInputPatch(
  id: AuditServerSettingFieldId,
  value: number
): PatchAuditSettingsRequest | null {
  switch (id) {
    case 'minLengthOfReasonForInteraction':
      return { data: { minLengthOfReasonForInteraction: value } }
    default:
      return null
  }
}
