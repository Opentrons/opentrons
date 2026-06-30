import { describe, expect, it } from 'vitest'

import { getAuthPatchForInputChange } from '../complianceReadySettingsHelper'

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

  it('should patch nested input under a UI-only parent even when server state is off', () => {
    expect(
      getAuthPatchForInputChange(
        'passwordResetTime',
        '30',
        BASE_FIELD_VALUES,
        'passwordResetEnabled'
      )
    ).toEqual({ data: { passwordResetTime: 30 * SECONDS_PER_DAY } })
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
