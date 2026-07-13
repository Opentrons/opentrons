import { describe, expect, it } from 'vitest'

import {
  getAuditInputPatch,
  getAuthInputPatch,
  getFieldValuesFromSettings,
} from '../complianceReadySettingsHelper'

import type {
  AuditSettingsData,
  AuthSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type { FieldValues } from '../complianceReadySettingsTypes'

const AUTH_SETTINGS: AuthSettingsData = {
  maxNumberOfLoginAttempts: 5,
  passwordResetTime: 90 * 24 * 60 * 60,
  passwordComplexityMinimumLength: 8,
  passwordComplexitySpecialCharacters: true,
  idleLogout: 180,
  requireAdminCredsWhenUpdatingRobotSoftware: true,
  requireAdminCredsWhenSendingProtocolToRobot: false,
  requireAdminCredsForSignoffProtocol: false,
}

const ROBOT_SERVER_SETTINGS: RobotServerAccessControlSettingsData = {
  requireSignoffForProtocolLog: true,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: true,
}

const AUDIT_SERVER_SETTINGS: AuditSettingsData = {
  requireReasonForInteraction: true,
  minLengthOfReasonForInteraction: 10,
}

const BASE_FIELD_VALUES = getFieldValuesFromSettings(
  AUTH_SETTINGS,
  ROBOT_SERVER_SETTINGS,
  AUDIT_SERVER_SETTINGS
)

describe('getFieldValuesFromSettings', () => {
  it('should map auth settings to form field values', () => {
    expect(BASE_FIELD_VALUES).toMatchObject({
      idleLogout: '3',
      passwordResetTime: '90',
      passwordResetEnabled: true,
      passwordComplexityEnabled: true,
    })
  })

  it('should map robot server settings with false defaults', () => {
    expect(
      getFieldValuesFromSettings(
        {},
        { requireSignoffForProtocolLog: undefined }
      )
    ).toMatchObject({
      requireSignoffForProtocolLog: false,
      requireLogsToBeSavedInApp: false,
      deleteOverMaxOnDiskProtocols: false,
    })
  })

  it('should map audit server settings to form field values', () => {
    expect(BASE_FIELD_VALUES).toMatchObject({
      requireReasonForInteraction: true,
      minLengthOfReasonForInteraction: '10',
    })
  })
})

describe('getAuthInputPatch', () => {
  it('should patch maxNumberOfLoginAttempts input', () => {
    expect(
      getAuthInputPatch('maxNumberOfLoginAttempts', '10', BASE_FIELD_VALUES)
    ).toEqual({ data: { maxNumberOfLoginAttempts: 10 } })
  })

  it('should patch idleLogout input with minute conversion', () => {
    expect(getAuthInputPatch('idleLogout', '5', BASE_FIELD_VALUES)).toEqual({
      data: { idleLogout: 300 },
    })
  })

  it('should return null when input value is empty', () => {
    expect(getAuthInputPatch('idleLogout', '', BASE_FIELD_VALUES)).toBeNull()
    expect(
      getAuthInputPatch('passwordResetTime', '', BASE_FIELD_VALUES)
    ).toBeNull()
  })

  it('should patch passwordResetTime with day conversion', () => {
    expect(
      getAuthInputPatch('passwordResetTime', '30', BASE_FIELD_VALUES)
    ).toEqual({ data: { passwordResetTime: 30 * 24 * 60 * 60 } })
  })
})

describe('getAuditInputPatch', () => {
  it('should not patch minLengthOfReasonForInteraction when parent is off', () => {
    const fieldValues: FieldValues = {
      ...BASE_FIELD_VALUES,
      requireReasonForInteraction: false,
    }

    expect(
      getAuditInputPatch('minLengthOfReasonForInteraction', '10', fieldValues)
    ).toBeNull()
  })
})
