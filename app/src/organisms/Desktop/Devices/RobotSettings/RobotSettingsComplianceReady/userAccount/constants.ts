import type { AuthUserAccountType } from '@opentrons/api-client'

export const USERNAME_MAX_LENGTH = 20

export const MANAGEABLE_USER_ACCOUNT_TYPES: AuthUserAccountType[] = [
  'admin',
  'user',
  'auditor',
]
