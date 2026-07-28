import { describe, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { useIsRobotOutOfStorage } from '../useIsRobotOutOfStorage'

vi.mock('@opentrons/react-api-client')

describe('useIsRobotOutOfStorage', () => {
  it('returns false if robot is not in access control mode', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as any)
  })
})
