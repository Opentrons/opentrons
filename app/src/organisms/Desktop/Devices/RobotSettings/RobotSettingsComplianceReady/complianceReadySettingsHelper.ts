import { ACCESS_CONTROL_SETTING_KEYS } from '@opentrons/api-client'

import { SETTINGS_SECTIONS } from './complianceReadySettingsConfig'
import { UI_ONLY_FIELD_IDS } from './complianceReadySettingsTypes'

import type {
  AccessControlAppSettingsResponse,
  AuthSettingsResponse,
  PatchAccessControlSettingsRequest,
  PatchAuthSettingsRequest,
} from '@opentrons/api-client'
import type {
  AuthSettingFieldId,
  FieldValues,
  InputFieldConfig,
  RobotServerSettingFieldId,
  SettingFieldId,
  ToggleFieldConfig,
  UiSettingFieldId,
} from './complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

function getAuthSettingFieldValue(
  key: AuthSettingFieldId,
  authSettings: AuthSettingsResponse['data']
): string | boolean {
  switch (key) {
    case 'idleLogout':
      return String(Math.round(authSettings.idleLogout / SECONDS_PER_MINUTE))
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

function getAuthFieldValues(
  authSettings?: AuthSettingsResponse['data']
): Partial<Pick<FieldValues, AuthSettingFieldId>> {
  if (authSettings == null) {
    return {}
  }

  return (Object.keys(authSettings) as AuthSettingFieldId[]).reduce(
    (acc, key) => ({
      ...acc,
      [key]: getAuthSettingFieldValue(key, authSettings),
    }),
    {} as Pick<FieldValues, AuthSettingFieldId>
  )
}

function getRobotServerFieldValues(
  robotSettings?: AccessControlAppSettingsResponse['data']
): Pick<FieldValues, RobotServerSettingFieldId> {
  return ACCESS_CONTROL_SETTING_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: robotSettings?.[key] ?? false,
    }),
    {} as Pick<FieldValues, RobotServerSettingFieldId>
  )
}

/** Map auth- and robot-server settings responses to form field values. */
export function getFieldValuesFromSettings(
  authSettings?: AuthSettingsResponse['data'],
  robotSettings?: AccessControlAppSettingsResponse['data']
): FieldValues {
  return {
    ...getAuthFieldValues(authSettings),
    passwordResetEnabled: authSettings?.passwordResetTime != null,
    passwordComplexityEnabled:
      authSettings != null
        ? authSettings.passwordComplexityMinimumLength != null ||
          authSettings.passwordComplexitySpecialCharacters
        : false,
    ...getRobotServerFieldValues(robotSettings),
  } as FieldValues
}

/** Form values after nested auth fields are nulled (feature disabled on server). */
function getFieldValuesWithNulledAuthFields(
  authSettings: AuthSettingsResponse['data'],
  nulledFieldIds: AuthSettingFieldId[],
  robotSettings?: AccessControlAppSettingsResponse['data']
): FieldValues {
  return getFieldValuesFromSettings(
    {
      ...authSettings,
      ...Object.fromEntries(nulledFieldIds.map(key => [key, null])),
    } as AuthSettingsResponse['data'],
    robotSettings
  )
}

export type ComplianceReadySettingsPatch =
  | { target: 'auth'; request: PatchAuthSettingsRequest }
  | { target: 'robot'; request: PatchAccessControlSettingsRequest }

/** Updated form state and an optional patch to persist the change. */
export interface ComplianceReadyToggleChangeResult {
  fieldValues: FieldValues
  patch?: ComplianceReadySettingsPatch
}

/** Field id exists only in the UI and has no auth-server counterpart. */
function isUiOnlyFieldId(id: SettingFieldId): id is UiSettingFieldId {
  return (UI_ONLY_FIELD_IDS as readonly string[]).includes(id)
}

/** Field id maps to a key on GET/PATCH `/auth/settings`. */
function isAuthSettingFieldId(id: SettingFieldId): id is AuthSettingFieldId {
  return !isUiOnlyFieldId(id) && !isRobotServerSettingFieldId(id)
}

/** Field id maps to a key on GET/PATCH access-control app settings. */
function isRobotServerSettingFieldId(
  id: SettingFieldId
): id is RobotServerSettingFieldId {
  return (ACCESS_CONTROL_SETTING_KEYS as readonly string[]).includes(id)
}

/**
 * Parent toggle that groups auth fields in the UI but is not itself an API key
 * (e.g. `passwordResetEnabled`).
 */
function isUiOnlyParentToggle(field: ToggleFieldConfig): boolean {
  return field.children != null && !isAuthSettingFieldId(field.id)
}

/** All auth-server field ids nested under a toggle, including nested toggles. */
function getAuthChildFieldIds(field: ToggleFieldConfig): AuthSettingFieldId[] {
  return (field.children ?? []).flatMap(child => {
    if (child.type === 'input') {
      return [child.id]
    }
    return [child.id as AuthSettingFieldId, ...getAuthChildFieldIds(child)]
  })
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

/** PATCH body with a single changed auth setting field. */
function buildAuthFieldPatchRequest(
  id: AuthSettingFieldId,
  value: NonNullable<PatchAuthSettingsRequest['data']>[AuthSettingFieldId]
): PatchAuthSettingsRequest {
  return { data: { [id]: value } }
}

/**
 * Local form state after turning off a UI-only parent toggle.
 * Reuses getFieldValuesFromSettings with nested auth fields nulled, matching
 * the server state after buildParentDisablePatchRequest succeeds.
 */
function getParentDisabledFieldValues(
  parentField: ToggleFieldConfig,
  authSettings: AuthSettingsResponse['data'],
  robotSettings?: AccessControlAppSettingsResponse['data']
): FieldValues {
  return getFieldValuesWithNulledAuthFields(
    authSettings,
    getAuthChildFieldIds(parentField),
    robotSettings
  )
}

/**
 * PATCH request sent when a UI-only parent toggle is turned off.
 * Nulls every nested auth field so the requirement is removed on the server.
 */
function buildParentDisablePatchRequest(
  parentField: ToggleFieldConfig
): PatchAuthSettingsRequest {
  return {
    data: Object.fromEntries(
      getAuthChildFieldIds(parentField).map(key => [key, null])
    ) as PatchAuthSettingsRequest['data'],
  }
}

/** Top-level input fields from config (not nested under a parent toggle). */
function isTopLevelInputField(id: AuthSettingFieldId): boolean {
  return SETTINGS_SECTIONS.some(section =>
    section.fields.some(
      (field): field is InputFieldConfig =>
        field.type === 'input' && field.id === id
    )
  )
}

/**
 * Returns true when a standalone input change should be persisted.
 * idleLogout is non-nullable on the auth server, so clearing the field must
 * not send a PATCH until the user enters a valid number of minutes.
 */
function shouldPersistStandaloneInputChange(
  id: AuthSettingFieldId,
  value: string
): boolean {
  if (!isTopLevelInputField(id)) {
    return false
  }

  if (id === 'idleLogout' && value === '') {
    return false
  }

  return true
}

/**
 * Auth-server patch for an input value, if it should be persisted.
 */
export function getAuthPatchForInputChange(
  id: AuthSettingFieldId,
  value: string,
  fieldValues: FieldValues,
  parentField?: ToggleFieldConfig
): PatchAuthSettingsRequest | null {
  const nextFieldValues: FieldValues = { ...fieldValues, [id]: value }

  if (parentField?.children != null) {
    if (!Boolean(nextFieldValues[parentField.id]) || value === '') {
      return null
    }
    return buildAuthFieldPatchRequest(
      id,
      getAuthFieldPatchValue(id, nextFieldValues)
    )
  }

  if (shouldPersistStandaloneInputChange(id, value)) {
    return buildAuthFieldPatchRequest(
      id,
      getAuthFieldPatchValue(id, nextFieldValues)
    )
  }

  return null
}

/**
 * Resolve updated form state and an optional patch for a toggle change.
 *
 * Unlike inputs, toggles can update multiple local fields at once (e.g. turning
 * off a UI-only parent clears all nested children via getFieldValuesFromSettings).
 *
 * `authSettings` is required when disabling a UI-only parent toggle.
 */
export function resolveComplianceReadyToggleChange(
  field: ToggleFieldConfig,
  fieldValues: FieldValues,
  parentField?: ToggleFieldConfig,
  authSettings?: AuthSettingsResponse['data'],
  robotSettings?: AccessControlAppSettingsResponse['data']
): ComplianceReadyToggleChangeResult {
  const toggledOn = !Boolean(fieldValues[field.id])

  if (field.children != null && isUiOnlyParentToggle(field)) {
    if (toggledOn) {
      return { fieldValues: { ...fieldValues, [field.id]: true } }
    }
    if (authSettings == null) {
      throw new Error(
        'authSettings is required when disabling a UI-only parent toggle'
      )
    }
    return {
      fieldValues: getParentDisabledFieldValues(
        field,
        authSettings,
        robotSettings
      ),
      patch: {
        target: 'auth',
        request: buildParentDisablePatchRequest(field),
      },
    }
  }

  if (parentField?.children != null) {
    const nextFieldValues: FieldValues = {
      ...fieldValues,
      [field.id]: toggledOn,
    }
    if (!Boolean(nextFieldValues[parentField.id])) {
      return { fieldValues: nextFieldValues }
    }
    if (!isAuthSettingFieldId(field.id)) {
      return { fieldValues: nextFieldValues }
    }
    return {
      fieldValues: nextFieldValues,
      patch: {
        target: 'auth',
        request: buildAuthFieldPatchRequest(
          field.id,
          getAuthFieldPatchValue(field.id, nextFieldValues)
        ),
      },
    }
  }

  if (isRobotServerSettingFieldId(field.id)) {
    return {
      fieldValues: { ...fieldValues, [field.id]: toggledOn },
      patch: {
        target: 'robot',
        request: { data: { [field.id]: toggledOn } },
      },
    }
  }

  const nextFieldValues: FieldValues = {
    ...fieldValues,
    [field.id]: toggledOn,
  }

  return {
    fieldValues: nextFieldValues,
    patch: {
      target: 'auth',
      request: buildAuthFieldPatchRequest(
        field.id as AuthSettingFieldId,
        getAuthFieldPatchValue(field.id as AuthSettingFieldId, nextFieldValues)
      ),
    },
  }
}
