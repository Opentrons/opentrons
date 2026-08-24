import type { AuthUserAccountType } from '@opentrons/api-client'

export const USERNAME_MAX_LENGTH = 20

export const ADD_USER_WIZARD_TOTAL_STEPS = 2
export const ADD_USER_WIZARD_CREATE_ACCOUNT_STEP = 0
export const ADD_USER_WIZARD_ONE_TIME_PASSWORD_STEP = 2

export const MANAGEABLE_USER_ACCOUNT_TYPES: AuthUserAccountType[] = [
  'admin',
  'user',
  'auditor',
]
