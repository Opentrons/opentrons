import { describe, expect, it } from 'vitest'

import {
  getAuthPatchForInputChange,
  resolveComplianceReadyToggleChange,
} from '../complianceReadySettingsHelper'

import type {
  ComplianceReadyToggleFieldDescriptor,
  FieldValues,
} from '../complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

const resolveToggle = (
  field: ComplianceReadyToggleFieldDescriptor,
  fieldValues: FieldValues,
  parentField?: ComplianceReadyToggleFieldDescriptor
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

const PASSWORD_RESET_PARENT: ComplianceReadyToggleFieldDescriptor = {
  id: 'passwordResetEnabled',
  children: ['passwordResetTime'],
}

const PASSWORD_COMPLEXITY_PARENT: ComplianceReadyToggleFieldDescriptor = {
  id: 'passwordComplexityEnabled',
  children: [
    'passwordComplexitySpecialCharacters',
    'passwordComplexityMinimumLength',
  ],
}

const REQUIRE_REASON_PARENT: ComplianceReadyToggleFieldDescriptor = {
  id: 'requireReasonForInteraction',
  children: ['minLengthOfReasonForInteraction'],
}

describe('getAuthPatchForInputChange', () => {
  it('should patch standalone maxNumberOfLoginAttempts input', () => {
    expect(
      getAuthPatchForInputChange(
        'maxNumberOfLoginAttempts',
        '10',
        BASE_FIELD_VALUES
      )
    ).toEqual({ data: { maxNumberOfLoginAttempts: 10 } })
  })

  it('should patch standalone idleLogout input', () => {
    expect(
      getAuthPatchForInputChange('idleLogout', '5', BASE_FIELD_VALUES)
    ).toEqual({ data: { idleLogout: 5 * SECONDS_PER_MINUTE } })
  })

  it('should not patch idleLogout when cleared', () => {
    expect(
      getAuthPatchForInputChange('idleLogout', '', BASE_FIELD_VALUES)
    ).toBeNull()
  })

  it('should not patch nested input when parent toggle is off', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '30',
        BASE_FIELD_VALUES,
        PASSWORD_RESET_PARENT
      )
    ).toBeNull()
  })

  it('should patch nested input when parent toggle is on and value is present', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '30',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        PASSWORD_RESET_PARENT
      )
    ).toEqual({ data: { passwordResetTime: 30 * SECONDS_PER_DAY } })
  })

  it('should not patch nested input when parent is on but value is empty', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        PASSWORD_RESET_PARENT
      )
    ).toBeNull()
  })

  it('should patch only the changed child for nested UI-only parent children', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordComplexityMinimumLength',
        '12',
        {
          ...BASE_FIELD_VALUES,
          passwordComplexityEnabled: true,
        },
        PASSWORD_COMPLEXITY_PARENT
      )
    ).toEqual({ data: { passwordComplexityMinimumLength: 12 } })
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
    const result = resolveToggle(
      { id: 'passwordComplexitySpecialCharacters' },
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
    const result = resolveToggle(
      { id: 'passwordComplexitySpecialCharacters' },
      BASE_FIELD_VALUES,
      PASSWORD_COMPLEXITY_PARENT
    )

    expect(result.fieldValues.passwordComplexitySpecialCharacters).toBe(true)
    expect(result.authPatch).toBeUndefined()
    expect(result.appAccessControlPatch).toBeUndefined()
  })

  it('should patch auth server when toggling a standalone auth setting', () => {
    const result = resolveToggle(
      { id: 'requireAdminCredsWhenUpdatingRobotSoftware' },
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
      { id: 'requireSignoffForProtocolLog' },
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
