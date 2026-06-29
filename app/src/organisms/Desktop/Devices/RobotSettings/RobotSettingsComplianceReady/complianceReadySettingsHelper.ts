import {
  AUTH_SERVER_SETTING_FIELD_IDS,
} from './complianceReadySettingsTypes'

import type {
  AuthSettingsData,
  PatchAuthSettingsRequest,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  FieldValues,
  SettingFieldId,
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

  return {
    ...(authFieldValues as Pick<FieldValues, AuthSettingFieldId>),
    passwordResetEnabled: Boolean(authSettingsData.passwordResetTime),
    passwordComplexityEnabled:
      Boolean(authSettingsData.passwordComplexityMinimumLength) ||
      Boolean(authSettingsData.passwordComplexitySpecialCharacters),
    requireSignoffForProtocolLog:
      robotServerAccessControlSettingsData.requireSignoffForProtocolLog ??
      false,
    requireLogsToBeSavedInApp:
      robotServerAccessControlSettingsData.requireLogsToBeSavedInApp ?? false,
    deleteOverMaxOnDiskProtocols:
      robotServerAccessControlSettingsData.deleteOverMaxOnDiskProtocols ??
      false,
  }
}

/** Auth-server patch for an input value, if it should be persisted. */
export function getAuthPatchForInputChange(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues,
  parentFieldId?: SettingFieldId
): PatchAuthSettingsRequest | null {
  if (parentFieldId != null) {
    if (!Boolean(fieldValues[parentFieldId]) || value === '') {
      return null
    }
  } else if (
    (id !== 'maxNumberOfLoginAttempts' && id !== 'idleLogout') ||
    (id === 'idleLogout' && value === '')
  ) {
    return null
  }

  switch (id) {
    case 'passwordResetTime':
      return { data: { passwordResetTime: Number(value) * SECONDS_PER_DAY } }
    case 'idleLogout':
      return { data: { idleLogout: Number(value) * SECONDS_PER_MINUTE } }
    case 'passwordComplexityMinimumLength':
      return { data: { passwordComplexityMinimumLength: Number(value) } }
    case 'minLengthOfReasonForInteraction':
      return { data: { minLengthOfReasonForInteraction: Number(value) } }
    case 'maxNumberOfLoginAttempts':
      return {
        data: {
          maxNumberOfLoginAttempts: value === '' ? null : Number(value),
        },
      }
    default:
      return null
  }
}
