import { describe, expect, it } from 'vitest'

import {
  getAuditInputPatch,
  getFieldValuesFromSettings,
  getInputPatch,
} from '../complianceReadySettingsHelper'

import type {
  AuditSettingsData,
  AuthSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'

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
      maxNumberOfLoginAttempts: 5,
      idleLogout: 3,
      passwordResetTime: 90,
      passwordComplexityMinimumLength: 8,
      passwordResetEnabled: true,
      passwordComplexityEnabled: true,
    })
  })

  it('should round idleLogout seconds to the nearest minute', () => {
    expect(
      getFieldValuesFromSettings({ ...AUTH_SETTINGS, idleLogout: 90 })
    ).toMatchObject({
      idleLogout: 2,
    })
  })

  it('should map missing numeric settings to null', () => {
    expect(
      getFieldValuesFromSettings({
        ...AUTH_SETTINGS,
        idleLogout: null,
        passwordResetTime: null,
        maxNumberOfLoginAttempts: null,
      })
    ).toMatchObject({
      idleLogout: null,
      passwordResetTime: null,
      maxNumberOfLoginAttempts: null,
      passwordResetEnabled: false,
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
      minLengthOfReasonForInteraction: 10,
    })
  })
})

describe('getInputPatch', () => {
  it('should patch maxNumberOfLoginAttempts input', () => {
    expect(getInputPatch('maxNumberOfLoginAttempts', 3)).toEqual({
      data: { maxNumberOfLoginAttempts: 3 },
    })
  })

  it('should patch idleLogout input with minute conversion', () => {
    expect(getInputPatch('idleLogout', 5)).toEqual({
      data: { idleLogout: 300 },
    })
  })

  it('should patch passwordResetTime with day conversion', () => {
    expect(getInputPatch('passwordResetTime', 1)).toEqual({
      data: { passwordResetTime: 1 * 24 * 60 * 60 },
    })
    expect(getInputPatch('passwordResetTime', 30)).toEqual({
      data: { passwordResetTime: 30 * 24 * 60 * 60 },
    })
  })

  it('should patch passwordComplexityMinimumLength', () => {
    expect(getInputPatch('passwordComplexityMinimumLength', 12)).toEqual({
      data: { passwordComplexityMinimumLength: 12 },
    })
    expect(getInputPatch('passwordComplexityMinimumLength', 256)).toEqual({
      data: { passwordComplexityMinimumLength: 256 },
    })
  })

  it('should return null for settings that are not numeric inputs', () => {
    expect(
      getInputPatch('requireAdminCredsWhenUpdatingRobotSoftware', 1)
    ).toBeNull()
  })
})

describe('getAuditInputPatch', () => {
  it('should patch minLengthOfReasonForInteraction', () => {
    expect(getAuditInputPatch('minLengthOfReasonForInteraction', 10)).toEqual({
      data: { minLengthOfReasonForInteraction: 10 },
    })
  })

  it('should return null for settings that are not numeric inputs', () => {
    expect(getAuditInputPatch('requireReasonForInteraction', 10)).toBeNull()
  })
})
