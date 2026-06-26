import { describe, expect, it } from 'vitest'

import { SETTINGS_SECTIONS } from '../complianceReadySettingsConfig'
import {
  getAuthPatchForInputChange,
  resolveComplianceReadyToggleChange,
} from '../complianceReadySettingsHelper'

import type {
  FieldValues,
  SettingFieldId,
  ToggleFieldConfig,
} from '../complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

const resolveToggle = (
  field: ToggleFieldConfig,
  fieldValues: FieldValues,
  parentField?: ToggleFieldConfig
) => resolveComplianceReadyToggleChange(field, fieldValues, parentField)

const BASE_FIELD_VALUES = {
  maxNumberOfLoginAttempts: '5',
  passwordResetTime: '',
  passwordComplexityMinimumLength: '8',
  passwordComplexitySpecialCharacters: false,
  idleLogout: '3',
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: '10',
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsWhenSendingProtocolToRobot: true,
  requireAdminCredsForSignoffProtocol: false,
  requireSignoffForProtocolLog: true,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: true,
  passwordResetEnabled: false,
  passwordComplexityEnabled: false,
} as FieldValues

function getToggleField(fieldId: SettingFieldId): ToggleFieldConfig {
  for (const section of SETTINGS_SECTIONS) {
    for (const field of section.fields) {
      if (field.id === fieldId && field.type === 'toggle') {
        return field
      }
    }
  }

  throw new Error(`Toggle field not found: ${fieldId}`)
}

const PASSWORD_RESET_PARENT = getToggleField('passwordResetEnabled')
const PASSWORD_COMPLEXITY_PARENT = getToggleField('passwordComplexityEnabled')
const REQUIRE_REASON_PARENT = getToggleField('requireReasonForInteraction')

describe('getAuthPatchForInputChange', () => {
  it('should patch standalone maxNumberOfLoginAttempts input', () => {
    expect(
      getAuthPatchForInputChange(
        'maxNumberOfLoginAttempts',
        '3',
        BASE_FIELD_VALUES
      )
    ).toEqual({
      data: { maxNumberOfLoginAttempts: 3 },
    })
  })

  it('should patch null when clearing standalone maxNumberOfLoginAttempts', () => {
    expect(
      getAuthPatchForInputChange(
        'maxNumberOfLoginAttempts',
        '',
        BASE_FIELD_VALUES
      )
    ).toEqual({
      data: { maxNumberOfLoginAttempts: null },
    })
  })

  it('should patch standalone idleLogout in minutes as seconds', () => {
    expect(
      getAuthPatchForInputChange('idleLogout', '10', BASE_FIELD_VALUES)
    ).toEqual({
      data: { idleLogout: 10 * SECONDS_PER_MINUTE },
    })
  })

  it('should not patch when clearing standalone idleLogout', () => {
    expect(
      getAuthPatchForInputChange('idleLogout', '', BASE_FIELD_VALUES)
    ).toBeNull()
  })

  it('should not patch when child input changes with parent off', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '90',
        BASE_FIELD_VALUES,
        PASSWORD_RESET_PARENT
      )
    ).toBeNull()
  })

  it('should not patch when child input is cleared with parent on', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        PASSWORD_RESET_PARENT
      )
    ).toBeNull()
  })

  it('should patch changed child when UI-only parent is on and child has a value', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '90',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        PASSWORD_RESET_PARENT
      )
    ).toEqual({
      data: { passwordResetTime: 90 * SECONDS_PER_DAY },
    })
  })

  it('should patch only the changed field when parent is a real auth toggle', () => {
    expect(
      getAuthPatchForInputChange(
        'minLengthOfReasonForInteraction',
        '25',
        BASE_FIELD_VALUES,
        REQUIRE_REASON_PARENT
      )
    ).toEqual({
      data: { minLengthOfReasonForInteraction: 25 },
    })
  })

  it('should patch only the changed child for nested UI-only parent children', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordComplexityMinimumLength',
        '12',
        {
          ...BASE_FIELD_VALUES,
          passwordComplexityEnabled: true,
          passwordComplexitySpecialCharacters: true,
        },
        PASSWORD_COMPLEXITY_PARENT
      )
    ).toEqual({
      data: { passwordComplexityMinimumLength: 12 },
    })
  })
})

describe('resolveComplianceReadyToggleChange', () => {
  it('should enable UI-only parent locally without patching', () => {
    const result = resolveToggle(PASSWORD_RESET_PARENT, BASE_FIELD_VALUES)

    expect(result.fieldValues.passwordResetEnabled).toBe(true)
    expect(result.authPatch).toBeUndefined()
    expect(result.appAccessControlPatch).toBeUndefined()
  })

  it('should clear child values and patch null when disabling UI-only parent', () => {
    const result = resolveToggle(PASSWORD_RESET_PARENT, {
      ...BASE_FIELD_VALUES,
      passwordResetEnabled: true,
      passwordResetTime: '30',
    })

    expect(result.fieldValues.passwordResetEnabled).toBe(false)
    expect(result.fieldValues.passwordResetTime).toBe('')
    expect(result.authPatch).toEqual({
      data: { passwordResetTime: null },
    })
  })

  it('should null all nested auth fields when disabling UI-only parent with multiple children', () => {
    const result = resolveToggle(PASSWORD_COMPLEXITY_PARENT, {
      ...BASE_FIELD_VALUES,
      passwordComplexityEnabled: true,
      passwordComplexitySpecialCharacters: true,
      passwordComplexityMinimumLength: '8',
    })

    expect(result.authPatch).toEqual({
      data: {
        passwordComplexitySpecialCharacters: null,
        passwordComplexityMinimumLength: null,
      },
    })
  })

  it('should patch changed child when toggling child under enabled UI-only parent', () => {
    const specialCharactersToggle = PASSWORD_COMPLEXITY_PARENT
      .children![0] as ToggleFieldConfig

    const result = resolveToggle(
      specialCharactersToggle,
      {
        ...BASE_FIELD_VALUES,
        passwordComplexityEnabled: true,
        passwordComplexitySpecialCharacters: false,
        passwordComplexityMinimumLength: '8',
      },
      PASSWORD_COMPLEXITY_PARENT
    )

    expect(result.fieldValues.passwordComplexitySpecialCharacters).toBe(true)
    expect(result.authPatch).toEqual({
      data: { passwordComplexitySpecialCharacters: true },
    })
  })

  it('should update local state only when toggling child with UI-only parent off', () => {
    const specialCharactersToggle = PASSWORD_COMPLEXITY_PARENT
      .children![0] as ToggleFieldConfig

    const result = resolveToggle(
      specialCharactersToggle,
      BASE_FIELD_VALUES,
      PASSWORD_COMPLEXITY_PARENT
    )

    expect(result.fieldValues.passwordComplexitySpecialCharacters).toBe(true)
    expect(result.authPatch).toBeUndefined()
    expect(result.appAccessControlPatch).toBeUndefined()
  })

  it('should patch auth server when toggling a standalone auth setting', () => {
    const result = resolveToggle(
      getToggleField('requireAdminCredsWhenUpdatingRobotSoftware'),
      BASE_FIELD_VALUES
    )

    expect(result.fieldValues.requireAdminCredsWhenUpdatingRobotSoftware).toBe(
      false
    )
    expect(result.authPatch).toEqual({
      data: { requireAdminCredsWhenUpdatingRobotSoftware: false },
    })
  })

  it('should patch robot server when toggling a robot server setting', () => {
    const result = resolveToggle(
      getToggleField('requireSignoffForProtocolLog'),
      BASE_FIELD_VALUES
    )

    expect(result.fieldValues.requireSignoffForProtocolLog).toBe(false)
    expect(result.appAccessControlPatch).toEqual({
      data: { requireSignoffForProtocolLog: false },
    })
  })

  it('should patch auth server when toggling a real auth parent with children', () => {
    const result = resolveToggle(REQUIRE_REASON_PARENT, BASE_FIELD_VALUES)

    expect(result.fieldValues.requireReasonForInteraction).toBe(false)
    expect(result.authPatch).toEqual({
      data: { requireReasonForInteraction: false },
    })
  })
})
