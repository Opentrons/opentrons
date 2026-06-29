import {
  AUTH_SERVER_SETTING_FIELD_IDS,
  isAuthInputFieldId,
  isAuthServerSettingKey,
  isRobotServerSettingKey,
  isUiOnlyFieldId,
  ROBOT_SERVER_SETTING_FIELD_IDS,
} from './complianceReadySettingsTypes'

import type {
  AuthSettingsData,
  PatchAuthSettingsRequest,
  PatchRobotServerAccessControlSettingsRequest,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  ComplianceReadyToggleChangeOptions,
  FieldValues,
  RobotServerSettingFieldId,
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

function getClearedFieldValue(id: SettingFieldId): string | boolean {
  return isAuthInputFieldId(id) ? '' : false
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

  const robotServerAccessControlFieldValues = (
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
    passwordResetEnabled: Boolean(authSettingsData.passwordResetTime),
    passwordComplexityEnabled:
      Boolean(authSettingsData.passwordComplexityMinimumLength) ||
      Boolean(authSettingsData.passwordComplexitySpecialCharacters),
    ...(robotServerAccessControlFieldValues as Pick<
      FieldValues,
      RobotServerSettingFieldId
    >),
  }
}

/** Updated form state and an optional patch to persist the change. */
export interface ComplianceReadyToggleChangeResult {
  fieldValues: FieldValues
  authPatch?: PatchAuthSettingsRequest
  robotServerAccessControlPatch?: PatchRobotServerAccessControlSettingsRequest
}

/**
 * Convert a form field value to the shape expected by PATCH `/auth/settings`.
 * Handles display-unit conversion (minutes/days) and empty-string → null.
 */
function getAuthFieldPatchValue(
  key: AuthSettingFieldId,
  values: FieldValues
): NonNullable<PatchAuthSettingsRequest['data']>[AuthSettingFieldId] {
  switch (key) {
    case 'passwordResetTime': {
      const days = String(values.passwordResetTime)
      return days === '' ? null : Number(days) * SECONDS_PER_DAY
    }
    case 'idleLogout':
      return Number(values.idleLogout) * SECONDS_PER_MINUTE
    case 'passwordComplexityMinimumLength':
      return Number(values.passwordComplexityMinimumLength)
    case 'passwordComplexitySpecialCharacters':
      return Boolean(values.passwordComplexitySpecialCharacters)
    case 'minLengthOfReasonForInteraction':
      return Number(values.minLengthOfReasonForInteraction)
    case 'maxNumberOfLoginAttempts': {
      const value = String(values.maxNumberOfLoginAttempts)
      return value === '' ? null : Number(value)
    }
    default:
      return values[key] as boolean
  }
}

function buildAuthPatch(
  id: AuthSettingFieldId,
  values: FieldValues
): PatchAuthSettingsRequest {
  return { data: { [id]: getAuthFieldPatchValue(id, values) } }
}

/**
 * Auth-server patch for an input value, if it should be persisted.
 */
export function getAuthPatchForInputChange(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues,
  parentFieldId?: SettingFieldId
): PatchAuthSettingsRequest | null {
  const nextFieldValues: FieldValues = { ...fieldValues, [id]: value }

  if (parentFieldId != null) {
    if (!Boolean(nextFieldValues[parentFieldId]) || value === '') {
      return null
    }
  } else if (
    (id !== 'maxNumberOfLoginAttempts' && id !== 'idleLogout') ||
    (id === 'idleLogout' && value === '')
  ) {
    return null
  }

  return buildAuthPatch(id, nextFieldValues)
}

/**
 * Resolve updated form state and an optional patch for a toggle change.
 */
export function resolveComplianceReadyToggleChange(
  fieldId: SettingFieldId,
  fieldValues: FieldValues,
  options?: ComplianceReadyToggleChangeOptions
): ComplianceReadyToggleChangeResult {
  const toggledOn = !Boolean(fieldValues[fieldId])
  const nextFieldValues: FieldValues = { ...fieldValues, [fieldId]: toggledOn }
  const { parentFieldId, childFieldIds } = options ?? {}

  if (isUiOnlyFieldId(fieldId) && childFieldIds != null) {
    if (toggledOn) {
      return { fieldValues: nextFieldValues }
    }

    const clearedFieldValues: FieldValues = {
      ...nextFieldValues,
      [fieldId]: false,
    }
    const authData: PatchAuthSettingsRequest['data'] = {}

    for (const childId of childFieldIds) {
      clearedFieldValues[childId] = getClearedFieldValue(childId)
      if (isAuthServerSettingKey(childId)) {
        authData[childId] = null
      }
    }

    return {
      fieldValues: clearedFieldValues,
      ...(Object.keys(authData).length > 0
        ? { authPatch: { data: authData } }
        : {}),
    }
  }

  if (parentFieldId != null) {
    if (
      !Boolean(nextFieldValues[parentFieldId]) ||
      !isAuthServerSettingKey(fieldId)
    ) {
      return { fieldValues: nextFieldValues }
    }
    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthPatch(fieldId, nextFieldValues),
    }
  }

  if (isRobotServerSettingKey(fieldId)) {
    return {
      fieldValues: nextFieldValues,
      robotServerAccessControlPatch: { data: { [fieldId]: toggledOn } },
    }
  }

  if (isAuthServerSettingKey(fieldId)) {
    return {
      fieldValues: nextFieldValues,
      authPatch: buildAuthPatch(fieldId, nextFieldValues),
    }
  }

  return { fieldValues: nextFieldValues }
}
