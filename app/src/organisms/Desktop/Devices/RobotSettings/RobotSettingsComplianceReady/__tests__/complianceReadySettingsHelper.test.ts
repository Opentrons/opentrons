import { describe, expect, it } from 'vitest'

import {
  getAuthPatchForInputChange,
  resolveComplianceReadyToggleChange,
} from '../complianceReadySettingsHelper'

import type { FieldValues } from '../complianceReadySettingsTypes'

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_DAY = 24 * 60 * 60

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
        'passwordResetEnabled'
      )
    ).toBeNull()
  })

  it('should patch nested input when parent toggle is on and value is present', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '30',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        'passwordResetEnabled'
      )
    ).toEqual({ data: { passwordResetTime: 30 * SECONDS_PER_DAY } })
  })

  it('should not patch nested input when parent is on but value is empty', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '',
        { ...BASE_FIELD_VALUES, passwordResetEnabled: true },
        'passwordResetEnabled'
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
        'passwordComplexityEnabled'
      )
    ).toEqual({ data: { passwordComplexityMinimumLength: 12 } })
  })
})

describe('resolveComplianceReadyToggleChange', () => {
  it('should not patch when enabling a UI-only parent', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'passwordResetEnabled',
        BASE_FIELD_VALUES,
        { childFieldIds: ['passwordResetTime'] }
      )
    ).toEqual({})
  })

  it('should patch null for auth children when disabling a UI-only parent', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'passwordResetEnabled',
        {
          ...BASE_FIELD_VALUES,
          passwordResetEnabled: true,
          passwordResetTime: '30',
        },
        { childFieldIds: ['passwordResetTime'] }
      )
    ).toEqual({
      authPatch: { data: { passwordResetTime: null } },
    })
  })

  it('should null all nested auth fields when disabling UI-only parent with multiple children', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'passwordComplexityEnabled',
        {
          ...BASE_FIELD_VALUES,
          passwordComplexityEnabled: true,
          passwordComplexitySpecialCharacters: true,
          passwordComplexityMinimumLength: '8',
        },
        {
          childFieldIds: [
            'passwordComplexitySpecialCharacters',
            'passwordComplexityMinimumLength',
          ],
        }
      )
    ).toEqual({
      authPatch: {
        data: {
          passwordComplexitySpecialCharacters: null,
          passwordComplexityMinimumLength: null,
        },
      },
    })
  })

  it('should patch auth server when toggling a child under an enabled UI-only parent', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'passwordComplexitySpecialCharacters',
        {
          ...BASE_FIELD_VALUES,
          passwordComplexityEnabled: true,
          passwordComplexitySpecialCharacters: false,
          passwordComplexityMinimumLength: '8',
        },
        { parentFieldId: 'passwordComplexityEnabled' }
      )
    ).toEqual({
      authPatch: { data: { passwordComplexitySpecialCharacters: true } },
    })
  })

  it('should not patch when toggling a child with UI-only parent off', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'passwordComplexitySpecialCharacters',
        BASE_FIELD_VALUES,
        { parentFieldId: 'passwordComplexityEnabled' }
      )
    ).toEqual({})
  })

  it('should patch auth server when toggling a standalone auth setting', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'requireAdminCredsWhenUpdatingRobotSoftware',
        BASE_FIELD_VALUES
      )
    ).toEqual({
      authPatch: {
        data: { requireAdminCredsWhenUpdatingRobotSoftware: false },
      },
    })
  })

  it('should patch robot server when toggling a robot server setting', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'requireSignoffForProtocolLog',
        BASE_FIELD_VALUES
      )
    ).toEqual({
      robotServerAccessControlPatch: {
        data: { requireSignoffForProtocolLog: false },
      },
    })
  })

  it('should patch auth server when toggling a real auth parent with children', () => {
    expect(
      resolveComplianceReadyToggleChange(
        'requireReasonForInteraction',
        BASE_FIELD_VALUES
      )
    ).toEqual({
      authPatch: { data: { requireReasonForInteraction: false } },
    })
  })
})
