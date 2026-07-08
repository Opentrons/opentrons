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

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60
export const MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH = 256

export function isValidLogoutIdleTime(value: string): boolean {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue > 0
}

export function isValidPasswordComplexityMinimumLength(value: string): boolean {
  const parsedValue = Number(value)
  return (
    Number.isInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= MAX_PASSWORD_COMPLEXITY_MINIMUM_LENGTH
  )
}

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsData
): string | boolean {
  switch (key) {
    case 'idleLogout':
      return authSettings.idleLogout != null
        ? String(authSettings.idleLogout / SECONDS_PER_MINUTE)
        : ''
    case 'passwordResetTime':
      return authSettings.passwordResetTime != null
        ? String(Math.round(authSettings.passwordResetTime / SECONDS_PER_DAY))
        : ''
    default: {
      const value = authSettings[key]
      if (typeof value === 'boolean') {
        return value
      }
      return value != null ? String(value) : ''
    }
  }
}

function getAuditSettingFieldValue(
  key: AuditServerSettingFieldId,
  auditSettings: AuditSettingsData
): string | boolean {
  switch (key) {
    default: {
      const value = auditSettings[key]
      if (typeof value === 'boolean') {
        return value
      }
      return value != null ? String(value) : ''
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
export function getAuthInputPatch(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues
): PatchAuthSettingsRequest | null {
  switch (id) {
    case 'maxNumberOfLoginAttempts':
      return {
        data: { maxNumberOfLoginAttempts: value === '' ? null : Number(value) },
      }
    case 'idleLogout':
      if (!isValidLogoutIdleTime(value)) {
        return null
      }
      return { data: { idleLogout: Number(value) * SECONDS_PER_MINUTE } }
    case 'passwordResetTime':
      if (value === '') {
        return null
      }
      return { data: { passwordResetTime: Number(value) * SECONDS_PER_DAY } }
    case 'passwordComplexityMinimumLength':
      if (!isValidPasswordComplexityMinimumLength(value)) {
        return null
      }
      return { data: { passwordComplexityMinimumLength: Number(value) } }

    default:
      return null
  }
}

export function getAuditInputPatch(
  id: AuditServerSettingFieldId,
  value: string,
  fieldValues: FieldValues
): PatchAuditSettingsRequest | null {
  switch (id) {
    case 'minLengthOfReasonForInteraction':
      if (!fieldValues.requireReasonForInteraction || value === '') {
        return null
      }
      return { data: { minLengthOfReasonForInteraction: Number(value) } }
    default:
      return null
  }
}
