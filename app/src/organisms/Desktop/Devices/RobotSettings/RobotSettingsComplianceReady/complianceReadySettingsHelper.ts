import {
  AUTH_SERVER_SETTING_FIELD_IDS,
  ROBOT_SERVER_SETTING_FIELD_IDS,
} from './complianceReadySettingsTypes'

import type {
  AuthSettingsData,
  PatchAuthSettingsRequest,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  FieldValues,
  RobotServerSettingFieldId,
} from './complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsData
): string | boolean {
  switch (key) {
    case 'idleLogout':
      return authSettings.idleLogout != null
        ? String(Math.round(authSettings.idleLogout / SECONDS_PER_MINUTE))
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

/** Map auth and robot-server access-control settings responses to form field values. */
export function getFieldValuesFromSettings(
  authSettings?: AuthSettingsData,
  robotServerAccessControlSettings?: RobotServerAccessControlSettingsData
): FieldValues {
  const authSettingsData = authSettings ?? {}
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
      if (value === '') {
        return null
      }
      return { data: { idleLogout: Number(value) * SECONDS_PER_MINUTE } }
    case 'passwordResetTime':
      if (value === '') {
        return null
      }
      return { data: { passwordResetTime: Number(value) * SECONDS_PER_DAY } }
    case 'passwordComplexityMinimumLength':
      if (value === '') {
        return null
      }
      return { data: { passwordComplexityMinimumLength: Number(value) } }
    case 'minLengthOfReasonForInteraction':
      if (!fieldValues.requireReasonForInteraction || value === '') {
        return null
      }
      return { data: { minLengthOfReasonForInteraction: Number(value) } }
    default:
      return null
  }
}
